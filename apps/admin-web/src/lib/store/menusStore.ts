// 메뉴 + 카테고리 통합 스토어
import { create } from 'zustand';
import type { Category, Menu } from '../types';
import {
  createCategory, createMenu, deleteCategory, deleteMenu,
  listCategories, listMenus, toggleSoldOut, updateCategory, updateMenu,
} from '../api';

interface MenusState {
  categories: Category[];
  menus: Menu[];
  loading: boolean;
  load: () => Promise<void>;

  // Category actions
  addCategory: (input: Omit<Category, 'id'>) => Promise<void>;
  patchCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  // Menu actions
  addMenu: (input: Omit<Menu, 'id'>) => Promise<void>;
  patchMenu: (id: string, patch: Partial<Menu>) => Promise<void>;
  removeMenu: (id: string) => Promise<void>;
  toggleSoldOut: (id: string, isSoldOut: boolean) => Promise<void>;
}

export const useMenusStore = create<MenusState>((set, get) => ({
  categories: [],
  menus: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const [categories, menus] = await Promise.all([listCategories(), listMenus()]);
    set({ categories, menus, loading: false });
  },

  addCategory: async (input) => { await createCategory(input); await get().load(); },
  patchCategory: async (id, patch) => { await updateCategory(id, patch); await get().load(); },
  removeCategory: async (id) => { await deleteCategory(id); await get().load(); },

  addMenu: async (input) => { await createMenu(input); await get().load(); },
  patchMenu: async (id, patch) => { await updateMenu(id, patch); await get().load(); },
  removeMenu: async (id) => { await deleteMenu(id); await get().load(); },
  toggleSoldOut: async (id, isSoldOut) => {
    // 낙관적 업데이트 - 토글 즉시 반영
    set({ menus: get().menus.map((m) => (m.id === id ? { ...m, isSoldOut } : m)) });
    await toggleSoldOut(id, isSoldOut);
  },
}));
