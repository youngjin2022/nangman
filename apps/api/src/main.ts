// 백엔드 부트스트랩 - Express + Prisma + Socket.IO
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './lib/prisma';
import { setupSocketIO } from './lib/socket';
import healthRouter from './routes/health';
import customerRouter from './routes/customer';
import posRouter from './routes/pos';
import adminRouter from './routes/admin';

const PORT = Number(process.env.PORT ?? 4000);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const app = express();

// CORS - 프로덕션은 화이트리스트로 좁힐 것
app.use(cors({
  origin: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// 라우트 마운트
app.use('/health', healthRouter);
app.use('/pos', posRouter);
app.use('/admin', adminRouter);
app.use('/', customerRouter); // /tables/by-token, /stores/:id/menu, /orders

app.get('/', (_req, res) => {
  res.json({
    service: 'nangman-api',
    env: NODE_ENV,
    version: '0.2.0',
  });
});

// 404
app.use((_req, res) => res.status(404).json({ error: 'not found' }));

// 에러 핸들러
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] unhandled:', err);
  res.status(500).json({ error: 'internal server error' });
});

// HTTP + Socket.IO 동시 마운트
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
    credentials: true,
  },
});
setupSocketIO(io);

httpServer.listen(PORT, () => {
  console.log(`[api] HTTP+WS listening on :${PORT} (${NODE_ENV})`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[api] ${signal} 수신 - 종료 중`);
  io.close();
  httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
