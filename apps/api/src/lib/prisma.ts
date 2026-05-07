// Prisma 클라이언트 싱글톤
// - 개발 중 ts-node-dev 재시작 시 다중 인스턴스 누적 방지를 위해 globalThis 캐시
// - 프로덕션은 단일 프로세스이므로 영향 없음

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
