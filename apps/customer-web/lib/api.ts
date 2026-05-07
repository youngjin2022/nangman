// API 클라이언트 - 실 백엔드 호출 전용
// 환경변수 NEXT_PUBLIC_API_URL로만 엔드포인트 결정 (하드코딩 금지)

import type {
  Category,
  CreateOrderPayload,
  CreateOrderResponse,
  Menu,
  TableSession,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  // 환경변수 누락 시 콘솔 경고 - 런타임 무한 실패 방지
  // eslint-disable-next-line no-console
  console.warn('[api] NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다');
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${path} ${text}`);
  }
  return res.json() as Promise<T>;
}

// QR 토큰으로 테이블 정보 조회
export async function getTableByToken(token: string): Promise<TableSession | null> {
  try {
    return await fetchJson<TableSession>(`/tables/by-token/${token}`);
  } catch {
    return null;
  }
}

// 매장 메뉴 (카테고리 + 메뉴 + 옵션)
export async function getMenuData(storeId: string): Promise<{
  categories: Category[];
  menus: Menu[];
}> {
  return fetchJson(`/stores/${storeId}/menu`);
}

// 주문 생성
export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return fetchJson<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
