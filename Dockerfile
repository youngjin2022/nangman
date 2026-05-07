FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# 루트 전체 복사 (모노레포 구조 유지)
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# 의존성 설치
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

# Prisma 클라이언트 생성 + 빌드
RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]