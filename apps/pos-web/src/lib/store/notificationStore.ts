// 토스트 알림 + 신규 주문 미확인 카운트 관리

import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
  // 클릭 시 이동/액션 (선택) - tableId가 있으면 해당 테이블로 포커스
  tableId?: string;
};

interface NotificationState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { id, ...t }] });
    // 자동 사라짐 (5초)
    setTimeout(() => get().dismiss(id), 5000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
