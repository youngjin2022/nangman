# 낭만포차 — 술집 모바일 오더 시스템

QR 기반 손님 주문, POS, 관리자, 주방·홀 프린터를 통합한 모노레포.

## 빠른 시작

```bash
# 1. 로컬 인프라 기동 (PostgreSQL + Redis)
docker compose up -d

# 2. 환경변수 설정
cp apps/api/.env.example apps/api/.env

# 3. 의존성 설치 (pnpm 9+ 필요)
corepack enable
pnpm install

# 4. DB 마이그레이션 + 시드
pnpm --filter api prisma migrate dev --name init
pnpm --filter api db:seed

# 5. 개발 서버 (모든 앱 동시 실행)
pnpm dev

# 또는 개별 실행
pnpm dev:customer   # http://localhost:3000  (손님 모바일)
pnpm dev:pos        # http://localhost:3001  (홀직원 POS)
pnpm dev:admin      # http://localhost:3002  (관리자)
pnpm dev:api        # http://localhost:4000  (백엔드 API)
```

## 모노레포 구성

```
nangman/
├── apps/
│   ├── customer-web/     ✅ Next.js 14 PWA — 손님 모바일 주문
│   ├── pos-web/          ✅ Vite + React — 홀직원 POS
│   ├── admin-web/        ✅ Vite + React — 관리자
│   ├── api/              ✅ Node + Prisma — 백엔드 (NestJS 마이그레이션 예정)
│   └── print-agent/      ⏸ 5단계 (매장 PC 상주 데몬)
├── packages/
│   ├── shared-types/     # 공통 도메인 타입
│   └── tsconfig/         # 공유 TS 설정
├── docker-compose.yml    # 로컬 PostgreSQL + Redis
├── BACKLOG.md            # 보류·진행 중 작업
├── DEPLOYMENT.md         # 배포 가이드 (Vercel + Railway)
└── turbo.json            # 빌드 오케스트레이션
```

각 앱의 자세한 사용법은 해당 폴더의 `README.md`를 참고하세요.

## 배포

| 앱 | 플랫폼 | 비고 |
|---|---|---|
| customer-web | Vercel | Next.js 자동 감지 · Root: `apps/customer-web` |
| pos-web | Vercel | Vite 정적 빌드 · Root: `apps/pos-web` |
| admin-web | Vercel | (예정) |
| api | Railway | Nixpacks · Root: `apps/api` |
| print-agent | (매장 내부) | 클라우드 배포 X — 매장 PC 상주 |

자세한 절차는 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고.

## 개발 진행 현황

[BACKLOG.md](./BACKLOG.md)에서 진행 중·보류·완료 작업을 추적합니다.

## 기술 스택

- 패키지 매니저: pnpm 9 + Turborepo
- 프론트: Next.js 14 / Vite 5 / React 18 / TailwindCSS / Zustand / Recharts
- 백엔드: Node http (NestJS 예정) + **Prisma 5 + PostgreSQL 16**
- 실시간: Socket.IO (예정)
- 캐시: Redis (선택)
- 결제: PortOne(아임포트) 또는 토스페이먼츠
- 프린터: ESC/POS (`node-thermal-printer`)
- 배포: Vercel(프론트) + Railway(API + PostgreSQL)

## 라이선스

Private.
