// POS API 클라이언트 - 실 백엔드 호출 전용
// 환경변수 VITE_API_URL로만 엔드포인트 결정

import type {
  Category,
  Menu,
  Order,
  OrderItem,
  PaymentPayload,
  TableDetail,
  TableOverview,
} from './types';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_URL 환경변수가 설정되지 않았습니다');
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${path} ${text}`);
  }
  return res.json();
}

// 매장 전체 테이블 현황
export async function getTables(): Promise<TableOverview[]> {
  return jsonFetch('/pos/tables');
}

// 테이블 상세 (주문 목록 포함)
export async function getTableDetail(tableId: string): Promise<TableDetail | null> {
  try {
    return await jsonFetch<TableDetail>(`/pos/tables/${tableId}`);
  } catch {
    return null;
  }
}

export async function getMenuData(): Promise<{ categories: Category[]; menus: Menu[] }> {
  return jsonFetch('/pos/menu');
}

// 신규 주문 확인 (PENDING → CONFIRMED)
export async function confirmOrder(orderId: string): Promise<void> {
  await jsonFetch(`/pos/orders/${orderId}/confirm`, { method: 'POST' });
}

// 주문 취소
export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  await jsonFetch(`/pos/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// POS에서 직접 추가 주문 입력
export async function createPosOrder(payload: {
  tableId: string;
  items: Array<Pick<OrderItem, 'menuId' | 'menuName' | 'unitPrice' | 'quantity' | 'options'>>;
  staffId?: string;
}): Promise<Order> {
  return jsonFetch('/pos/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 결제 처리
export async function processPayment(payload: PaymentPayload): Promise<{
  paymentId: string;
  approvedAt: string;
}> {
  return jsonFetch('/pos/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 테이블 초기화 (퇴석)
export async function clearTable(tableId: string): Promise<void> {
  await jsonFetch(`/pos/tables/${tableId}/clear`, { method: 'POST' });
}
