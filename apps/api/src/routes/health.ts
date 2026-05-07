// 헬스체크 - Railway healthcheckPath 대상
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', uptime: process.uptime(), db: 'ok' });
  } catch (e) {
    res.status(503).json({
      status: 'degraded',
      db: 'error',
      message: e instanceof Error ? e.message : 'unknown',
    });
  }
});

export default router;
