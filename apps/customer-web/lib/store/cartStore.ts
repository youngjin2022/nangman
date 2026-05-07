// 장바구니 상태 관리 - 새로고침/탭 이동에도 유지 (sessionStorage)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem } from '../types';
import { buildLineId } from '../utils';

interface CartState {
  items: CartItem[];
  memo: string;
  // 동일 lineId(메뉴+옵션 조합)면 수량만 증가, 신규면 추가
  addItem: (item: Omit<CartItem, 'lineId'> & { optionItemIds: string[] }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  setMemo: (memo: string) => void;
  clear: () => void;
  // 파생값
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      memo: '',

      addItem: ({ optionItemIds, ...rest }) => {
        const lineId = buildLineId(rest.menuId, optionItemIds);
        const existing = get().items.find((it) => it.lineId === lineId);
        if (existing) {
          // 동일 옵션 조합이면 수량 합산
          set({
            items: get().items.map((it) =>
              it.lineId === lineId ? { ...it, quantity: it.quantity + rest.quantity } : it,
            ),
          });
        } else {
          set({ items: [...get().items, { lineId, ...rest }] });
        }
      },

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({
          items: get().items.map((it) => (it.lineId === lineId ? { ...it, quantity } : it)),
        });
      },

      removeItem: (lineId) =>
        set({ items: get().items.filter((it) => it.lineId !== lineId) }),

      setMemo: (memo) => set({ memo }),

      clear: () => set({ items: [], memo: '' }),

      getTotalCount: () => get().items.reduce((sum, it) => sum + it.quantity, 0),

      getTotalAmount: () =>
        get().items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    }),
    {
      name: 'cart',
      storage: createJSONStorage(() => sessionStorage),
      // 파생 함수는 직렬화 제외 (items, memo만 영속)
      partialize: (state) =>
        ({ items: state.items, memo: state.memo }) as Partial<CartState>,
    },
  ),
);
