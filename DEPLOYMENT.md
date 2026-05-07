# 배포 가이드

각 앱은 독립된 서비스로 배포되며, 동일한 GitHub 레포(이 모노레포)를 가리킵니다.

## 사전 준비

1. GitHub에 레포 생성 후 푸시
   ```bash
   git init
   git add .
   git commit -m "chore: monorepo bootstrap"
   git branch -M main
   git remote add origin git@github.com:<org>/nangman.git
   git push -u origin main
   ```
2. Node 20 + pnpm 9 사용 (`packageManager` 필드로 자동 감지)

---

## Vercel — 프론트엔드 (customer-web, pos-web)

각 앱마다 **별도의 Vercel Project**를 만들어 동일 레포를 가리키게 합니다.

### customer-web (Next.js PWA)

1. Vercel 대시보드 → **Add New Project** → GitHub 레포 import
2. **Configure Project**
   - Project Name: `nangman-customer`
   - **Root Directory**: `apps/customer-web`
   - Framework Preset: **Next.js** (자동 감지)
   - Install/Build/Output Command: `vercel.json`이 처리하므로 비워둠
3. **Environment Variables**
   ```
   NEXT_PUBLIC_USE_MOCK=false
   NEXT_PUBLIC_API_URL=https://<api-railway-domain>
   ```
4. Deploy → 도메인 할당 (`nangman-customer.vercel.app`)

### pos-web (Vite SPA)

1. Vercel → **Add New Project** → 같은 레포 import
2. **Configure Project**
   - Project Name: `nangman-pos`
   - **Root Directory**: `apps/pos-web`
   - Framework Preset: **Vite** (자동 감지)
3. **Environment Variables**
   ```
   VITE_USE_MOCK=false
   VITE_API_URL=https://<api-railway-domain>
   ```
4. Deploy

### admin-web (6단계 이후)

위 pos-web과 동일한 절차. Root Directory만 `apps/admin-web`로.

### Vercel 모노레포 동작 방식

- 각 프로젝트의 `vercel.json`이 `cd ../..`로 레포 루트로 이동 후 `pnpm install` + `turbo run build --filter=<app>` 수행
- `turbo-ignore`로 해당 앱 변경이 없으면 빌드 스킵 (다른 앱 변경 시 불필요한 재배포 방지)
- pnpm 워크스페이스는 `packageManager` 필드(`pnpm@9.6.0`)로 Vercel이 자동 인식

---

## Railway — 백엔드 (api) + PostgreSQL

### 1. PostgreSQL 플러그인 먼저 추가

1. Railway 대시보드 → **New Project** → **Deploy PostgreSQL** 또는 기존 프로젝트에 **+ New** → **Database** → **PostgreSQL**
2. 추가되면 자동으로 다음 환경변수가 프로젝트에 주입됨:
   - `DATABASE_URL` (Connection String, Prisma가 사용)
   - 별도로 `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`도 노출됨
3. (선택) **Variables 탭**에서 `DATABASE_URL` 값 확인 가능

### 2. API 서비스 추가

1. 같은 프로젝트에서 **+ New** → **GitHub Repo** → 레포 선택
2. 서비스 설정:
   - Service Name: `nangman-api`
   - **Root Directory**: `apps/api`
   - Builder: **Nixpacks** (자동, `nixpacks.toml` 인식)
3. **Variables** 탭:
   - `DATABASE_URL`: PostgreSQL 서비스의 변수 참조로 연결
     - 우상단 **🔗 Variable Reference** 클릭 → PostgreSQL 서비스 → `DATABASE_URL` 선택
     - 또는 `${{Postgres.DATABASE_URL}}` 직접 입력
   - 추가 변수:
     ```
     NODE_ENV=production
     JWT_SECRET=<openssl rand -hex 32>
     PORTONE_API_KEY=
     PORTONE_API_SECRET=
     PRINT_AGENT_TOKEN=<openssl rand -hex 32>
     ```
4. **Networking** → Generate Domain → `https://nangman-api.up.railway.app`
5. Deploy → 자동 빌드·기동

### 3. 첫 배포 시 마이그레이션·시드

`nixpacks.toml`의 start 명령이 매 부팅마다 `prisma migrate deploy`를 자동 실행합니다.

초기 시드(샘플 매장·메뉴·테이블)는 별도 1회만 실행:

```bash
# 로컬에서 Railway DATABASE_URL을 임시로 가져와 실행
railway run --service nangman-api pnpm --filter api db:seed
# 또는 Railway 대시보드 → Service → Deploy Logs에서 일회성 명령으로
```

### 4. 마이그레이션 워크플로

⚠ **Railway에서 직접 `migrate dev`를 쓰지 마세요.** 항상 로컬에서 만들고 커밋한 마이그레이션이 `migrate deploy`로 적용되는 흐름을 유지합니다.

```bash
# 1) schema.prisma 수정 후
pnpm --filter api prisma migrate dev --name add_xxx

# 2) 생성된 마이그레이션 커밋
git add apps/api/prisma/migrations/
git commit -m "feat(api): add xxx"
git push origin main

# 3) Railway가 자동 빌드 → prisma migrate deploy 실행 → 배포
```

### Railway 모노레포 동작 방식

- Root Directory를 `apps/api`로 지정해도 `nixpacks.toml`의 `cd ../..`가 레포 루트로 이동
- pnpm workspace 의존성(`@nangman/shared-types`)을 turbo가 위상정렬하여 함께 빌드
- 환경변수 `PORT`는 Railway가 동적으로 주입 → `main.ts`에서 `process.env.PORT` 읽음
- `prisma generate`는 build 스크립트 내부에서 실행되어 `@prisma/client`가 빌드 시점에 준비됨

---

## 배포 후 연결

1. Railway에서 발급된 API 도메인을 복사
2. Vercel customer-web/pos-web의 `NEXT_PUBLIC_API_URL` / `VITE_API_URL`에 입력 → Redeploy
3. 손님 모바일에서 QR 토큰 진입 시 실제 API 호출 흐름 검증

## CI

`.github/workflows/ci.yml`이 PR마다 lint + type-check 수행. 통과 후 Vercel·Railway가 main 푸시에서 자동 배포.

## 비용 메모

- Vercel: Hobby 플랜 무료 (커머셜 사용은 Pro 필요)
- Railway: $5 크레딧/월(Starter), API + Postgres + Redis 합산해서 청구

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| Vercel 빌드 시 `Cannot find module '@nangman/shared-types'` | 워크스페이스 미인식 | `packageManager` 필드 확인, `pnpm-workspace.yaml` 커밋 여부 확인 |
| Railway 빌드 OOM | 단일 빌드 메모리 한계 | `turbo run build --filter=api...`로 필요한 패키지만 빌드 |
| Vercel 빌드 캐시 미적중 | turbo remote cache 미설정 | Project Settings → Turbo Remote Cache 활성화 |
