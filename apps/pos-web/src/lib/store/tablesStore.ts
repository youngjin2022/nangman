// 테이블 + 선택 테이블 상세 + 메뉴 데이터 통합 스토어

import { create } from 'zustand';
import type { Category, Menu, TableDetail, TableOverview } from '../types';
import {
  cancelOrder,
  clearTable,
  confirmOrder,
  createPosOrder,
  getMenuData,
  getTableDetail,
  getTables,
  processPayment,
} from '../api';
import type { OrderItem, PaymentMethod } from '../types';

interface TablesState {
  tables: TableOverview[];
  selectedTableId: string | null;
  selectedDetail: TableDetail | null;
  categories: Category[];
  menus: Menu[];
  loading: boolean;

  // 액션
  loadInitial: () => Promise<void>;
  selectTable: (tableId: string | null) => Promise<void>;
  refreshSelected: () => Promise<void>;
  refreshTables: () => Promise<void>;

  confirmOrderAction: (orderId: string) => Promise<void>;
  cancelOrderAction: (orderId: string, reason?: string) => Promise<void>;
  addPosOrder: (
    tableId: string,
    items: Array<Pick<OrderItem, 'menuId' | 'menuName' | 'unitPrice' | 'quantity' | 'options'>>,
  ) => Promise<void>;
  payAction: (
    tableId: string,
    orderIds: string[],
    method: PaymentMethod,
    amount: number,
  ) => Promise<void>;
  clearTableAction: (tableId: string) => Promise<void>;
}

export const useTablesStore = create<TablesState>((set, get) => ({
  tables: [],
  selectedTableId: null,
  selectedDetail: null,
  categories: [],
  menus: [],
  loading: false,

  loadInitial: async () => {
    set({ loading: true });
    const [tables, menuData] = await Promise.all([getTables(), getMenuData()]);
    set({
      tables,
      categories: menuData.categories,
      menus: menuData.menus,
      loading: false,
    });
    // 점유 테이블 중 미확인 우선 자동 선택
    const candidate =
      tables.find((t) => t.pendingOrderCount > 0) ??
      tables.find((t) => t.status === 'OCCUPIED');
    if (candidate) await get().selectTable(candidate.tableId);
  },

  selectTable: async (tableId) => {
    set({ selectedTableId: tableId });
    if (!tableId) {
      set({ selectedDetail: null });
      return;
    }
    const detail = await getTableDetail(tableId);
    set({ selectedDetail: detail });
  },

  refreshSelected: async () => {
    const id = get().selectedTableId;
    if (!id) return;
    const detail = await getTableDetail(id);
    set({ selectedDetail: detail });
  },

  refreshTables: async () => {
    const tables = await getTables();
    set({ tables });
  },

  confirmOrderAction: async (orderId) => {
    await confirmOrder(orderId);
    await Promise.all([get().refreshSelected(), get().refreshTables()]);
  },

  cancelOrderAction: async (orderId, reason) => {
    await cancelOrder(orderId, reason);
    await Promise.all([get().refreshSelected(), get().refreshTables()]);
  },

  addPosOrder: async (tableId, items) => {
    await createPosOrder({ tableId, items });
    await Promise.all([get().refreshSelected(), get().refreshTables()]);
  },

  payAction: async (tableId, orderIds, method, amount) => {
    await processPayment({ tableId, orderIds, method, amount });
    await Promise.all([get().refreshSelected(), get().refreshTables()]);
  },

  clearTableAction: async (tableId) => {
    await clearTable(tableId);
    set({ selectedTableId: null, selectedDetail: null });
    await get().refreshTables();
  },
}));
