// 관리자 API 클라이언트 - 실 백엔드 호출 전용
// 환경변수 VITE_API_URL로만 엔드포인트 결정

import type {
  AdminTable,
  Category,
  DailySalesData,
  Menu,
  MonthlySalesData,
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

// ===== 카테고리 =====
export async function listCategories(): Promise<Category[]> {
  return jsonFetch('/admin/categories');
}

export async function createCategory(input: Omit<Category, 'id'>): Promise<Category> {
  return jsonFetch('/admin/categories', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<Category> {
  return jsonFetch(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteCategory(id: string): Promise<void> {
  await jsonFetch(`/admin/categories/${id}`, { method: 'DELETE' });
}

// ===== 메뉴 =====
export async function listMenus(): Promise<Menu[]> {
  return jsonFetch('/admin/menus');
}

export async function createMenu(input: Omit<Menu, 'id'>): Promise<Menu> {
  return jsonFetch('/admin/menus', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateMenu(id: string, patch: Partial<Menu>): Promise<Menu> {
  return jsonFetch(`/admin/menus/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteMenu(id: string): Promise<void> {
  await jsonFetch(`/admin/menus/${id}`, { method: 'DELETE' });
}

export async function toggleSoldOut(id: string, isSoldOut: boolean): Promise<Menu> {
  return updateMenu(id, { isSoldOut });
}

// ===== 테이블 =====
export async function listTables(): Promise<AdminTable[]> {
  return jsonFetch('/admin/tables');
}

export async function createTable(
  input: Omit<AdminTable, 'id' | 'qrToken' | 'createdAt'>,
): Promise<AdminTable> {
  return jsonFetch('/admin/tables', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateTable(id: string, patch: Partial<AdminTable>): Promise<AdminTable> {
  return jsonFetch(`/admin/tables/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function deleteTable(id: string): Promise<void> {
  await jsonFetch(`/admin/tables/${id}`, { method: 'DELETE' });
}

export async function rotateQrToken(id: string): Promise<AdminTable> {
  return jsonFetch(`/admin/tables/${id}/rotate-qr`, { method: 'POST' });
}

// ===== 매출 =====
export async function getDailySales(date: string): Promise<DailySalesData> {
  return jsonFetch(`/admin/sales/daily?date=${date}`);
}

export async function getMonthlySales(month: string): Promise<MonthlySalesData> {
  return jsonFetch(`/admin/sales/monthly?month=${month}`);
}
