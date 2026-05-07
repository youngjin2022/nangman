// 테이블 관리 스토어
import { create } from 'zustand';
import type { AdminTable } from '../types';
import {
  createTable, deleteTable, listTables, rotateQrToken, updateTable,
} from '../api';

interface TablesState {
  tables: AdminTable[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: Omit<AdminTable, 'id' | 'qrToken' | 'createdAt'>) => Promise<void>;
  patch: (id: string, patch: Partial<AdminTable>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rotateQr: (id: string) => Promise<void>;
}

export const useTablesStore = create<TablesState>((set, get) => ({
  tables: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const tables = await listTables();
    set({ tables, loading: false });
  },
  add: async (input) => { await createTable(input); await get().load(); },
  patch: async (id, patch) => { await updateTable(id, patch); await get().load(); },
  remove: async (id) => { await deleteTable(id); await get().load(); },
  rotateQr: async (id) => { await rotateQrToken(id); await get().load(); },
}));
