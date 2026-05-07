FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

COPY package.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY tsconfig.json ./

# workspace 프로토콜 의존성 제거 후 설치
RUN node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
Object.keys(pkg.dependencies || {}).forEach(k => {
  if (pkg.dependencies[k].startsWith('workspace:')) delete pkg.dependencies[k];
});
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

RUN pnpm install --no-frozen-lockfile

RUN pnpm prisma generate && pnpm tsc -p tsconfig.json

EXPOSE 4000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]