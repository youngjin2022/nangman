FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

# Railway는 apps/api만 올리므로 필요한 파일을 미리 복사해둠
COPY package.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY tsconfig.json ./

# pnpm standalone 설치
RUN pnpm install --ignore-workspace

RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]