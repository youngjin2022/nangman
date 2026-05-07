# api

낭만포차 백엔드 API. **Prisma + PostgreSQL** 기반. Railway에 배포.

NestJS 마이그레이션 예정 — 현재는 Node `http` 기반 최소 라우터.

## 빠른 시작 (로컬)

```bash
# 1. 로컬 인프라 기동 (루트에서)
docker compose up -d

# 2. 환경변수 설정
cp apps/api/.env.example apps/api/.env

# 3. 의존성 설치 + Prisma 클라이언트 생성
pnpm install

# 4. 첫 마이그레이션 생성·적용 + 시드
pnpm --filter api prisma migrate dev --name init
pnpm --filter api db:seed

# 5. 개발 서버
pnpm --filter api dev
# http://localhost:4000/health
```

## Prisma 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm --filter api prisma:generate` | 클라이언트 생성 (`@prisma/client`) |
| `pnpm --filter api prisma:migrate -- --name <설명>` | 개발용 마이그레이션 생성·적용 |
| `pnpm --filter api prisma:migrate:deploy` | 프로덕션 마이그레이션 적용 (Railway가 자동 실행) |
| `pnpm --filter api prisma:reset` | DB 초기화 + 마이그레이션 재적용 + 시드 (⚠ 주의) |
| `pnpm --filter api prisma:studio` | Prisma Studio (GUI 데이터 탐색) |
| `pnpm --filter api db:seed` | 초기 시드 데이터 적재 |

## 엔드포인트 (현재 스켈레톤)

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | DB 핑 포함 헬스체크 — Railway healthcheckPath |
| GET | `/` | 서비스 메타 |
| GET | `/stores/:storeId/menu` | 매장 메뉴(카테고리·메뉴·옵션) |
| GET | `/tables/by-token/:token` | QR 토큰으로 테이블 조회 |

NestJS 도입 시 본 라우팅은 컨트롤러로 이전. 자세한 향후 구조는 [BACKLOG.md](../../BACKLOG.md) 참고.

## 데이터 모델

`prisma/schema.prisma` — 2단계 ERD를 그대로 옮김.

핵심 테이블: `Store`, `Staff`, `RestaurantTable`, `MenuCategory`, `Menu`, `MenuOptionGroup`, `MenuOptionItem`, `Order`, `OrderItem`, `OrderItemOption`, `Payment`, `DailySales`, `PrintJob`.

설계 원칙:
- 금액은 모두 `Int` (KRW 원 단위) — 부동소수점 오차 회피
- `OrderItem.menuNameSnapshot`, `unitPrice`, `OrderItemOption.optionNameSnapshot` — 메뉴 변경에도 과거 주문 무결성
- 인덱스: `Order(storeId, status, requestedAt)`, `Order(tableId, status)`, `Payment(pgTransactionId)` 등 자주 조회되는 조합
- ID는 `cuid()` — URL-friendly, 충돌 안전

## 배포 (Railway)

루트 [DEPLOYMENT.md](../../DEPLOYMENT.md) 참고. 핵심 흐름:

1. Railway 프로젝트 → **PostgreSQL 플러그인** 추가 → `DATABASE_URL` 자동 주입
2. **Add Service** → GitHub 레포 → Root Directory `apps/api`
3. Variables: `JWT_SECRET`, `PORTONE_*`, `PRINT_AGENT_TOKEN` 등
4. 배포 시 `nixpacks.toml`이 자동으로:
   - `pnpm install --frozen-lockfile`
   - `prisma generate` (build 스크립트 내부)
   - `tsc` 빌드
   - 기동 시 `prisma migrate deploy && node dist/main.js`

## 마이그레이션 워크플로

```bash
# 1) schema.prisma 수정
# 2) 로컬에서 마이그레이션 생성
pnpm --filter api prisma migrate dev --name add_xxx_field

# 3) 생성된 prisma/migrations/<timestamp>_add_xxx_field/ 커밋
git add apps/api/prisma/migrations/
git commit -m "feat(api): add xxx field"

# 4) main 푸시 → Railway가 자동으로 prisma migrate deploy 실행
```

⚠ Railway에서 직접 `migrate dev`를 쓰지 말 것 — 항상 로컬에서 만들고 커밋한 마이그레이션을 `migrate deploy`로 적용.
