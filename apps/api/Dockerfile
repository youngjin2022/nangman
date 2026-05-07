FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

COPY package.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY tsconfig.json ./
COPY tsconfig.prod.json ./
COPY strip-workspace.js ./

RUN node strip-workspace.js

RUN pnpm install --no-frozen-lockfile

RUN pnpm prisma generate && pnpm tsc -p tsconfig.prod.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]