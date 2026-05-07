// 실시간 이벤트 구독 - 백엔드 Socket.IO 서버에 연결
// 환경변수 VITE_SOCKET_URL · VITE_STORE_ID 사용

import { io, type Socket } from 'socket.io-client';
import type { Order, RealtimeEvent } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL;
const STORE_ID = import.meta.env.VITE_STORE_ID ?? 'store-001';

type Listener = (e: RealtimeEvent) => void;

const listeners = new Set<Listener>();
let socket: Socket | null = null;

function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log(`[socket] 연결됨: ${socket?.id}`);
    socket?.emit('join', { storeId: STORE_ID });
  });
  socket.on('disconnect', (reason) => {
    console.log(`[socket] 끊김: ${reason}`);
  });

  // 백엔드 emit 이벤트 → 내부 RealtimeEvent로 정규화 후 전파
  socket.on('order.created', (payload: { tableId: string; order: Order }) => {
    emit({ type: 'order.created', tableId: payload.tableId, order: payload.order });
  });
  socket.on('order.updated', (payload: { orderId: string; status: Order['status'] }) => {
    // tableId는 페이로드에 없을 수 있음 - POS는 currentSelected를 별도 관리
    emit({ type: 'order.updated', tableId: '', orderId: payload.orderId, status: payload.status });
  });
  socket.on('table.cleared', (payload: { tableId: string }) => {
    emit({ type: 'table.cleared', tableId: payload.tableId });
  });

  return socket;
}

export function subscribeRealtime(fn: Listener): () => void {
  listeners.add(fn);
  getSocket(); // 첫 구독 시 연결 보장
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && socket) {
      socket.disconnect();
      socket = null;
    }
  };
}

function emit(e: RealtimeEvent) {
  listeners.forEach((fn) => fn(e));
}
