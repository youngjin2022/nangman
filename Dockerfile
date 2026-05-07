FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api

RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]