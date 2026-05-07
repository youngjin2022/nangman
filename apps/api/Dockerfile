FROM node:20-alpine

# OpenSSL 설치 (Prisma 필수)
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

COPY apps/api/package.json ./
COPY apps/api/prisma/ ./prisma/
COPY apps/api/src/ ./src/
COPY apps/api/tsconfig.json ./
COPY apps/api/tsconfig.prod.json ./
COPY apps/api/strip-workspace.js ./

RUN node strip-workspace.js
RUN pnpm install --no-frozen-lockfile
RUN pnpm prisma generate && pnpm tsc -p tsconfig.prod.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]