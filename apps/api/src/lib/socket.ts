// Socket.IO 서버 설정 + 도메인 이벤트 발행 헬퍼
// 클라이언트는 connect 후 'join' 이벤트로 storeId 룸에 참여

import type { Server as SocketIOServer } from 'socket.io';
import type { Order, OrderStatus } from '@prisma/client';

let ioRef: SocketIOServer | null = null;

export function setupSocketIO(io: SocketIOServer) {
  ioRef = io;
  io.on('connection', (socket) => {
    console.log(`[socket] 연결: ${socket.id}`);

    // 매장 룸 참여 - POS·관리자용
    socket.on('join', (payload: { storeId?: string; tableId?: string }) => {
      if (payload?.storeId) {
        socket.join(`store:${payload.storeId}`);
        console.log(`[socket] ${socket.id} → store:${payload.storeId}`);
      }
      if (payload?.tableId) {
        socket.join(`table:${payload.tableId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] 끊김: ${socket.id} (${reason})`);
    });
  });
}

// ===== 이벤트 발행 헬퍼 - REST 라우트에서 호출 =====

export function emitOrderCreated(storeId: string, tableId: string, order: Order & { items: unknown[] }) {
  ioRef?.to(`store:${storeId}`).emit('order.created', { tableId, order });
}

export function emitOrderUpdated(storeId: string, orderId: string, status: OrderStatus) {
  ioRef?.to(`store:${storeId}`).emit('order.updated', { orderId, status });
}

export function emitTableCleared(storeId: string, tableId: string) {
  ioRef?.to(`store:${storeId}`).emit('table.cleared', { tableId });
}

export function emitMenuUpdated(storeId: string, menuId: string) {
  ioRef?.to(`store:${storeId}`).emit('menu.updated', { menuId });
}

export function emitPaymentApproved(storeId: string, orderId: string, paymentId: string) {
  ioRef?.to(`store:${storeId}`).emit('payment.approved', { orderId, paymentId });
}
