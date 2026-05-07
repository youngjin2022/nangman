// 토스트 알림 스토어
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'warn' | 'error';
export type Toast = { id: string; kind: ToastKind; title: string; message?: string };

interface NotificationState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { id, ...t }] });
    setTimeout(() => get().dismiss(id), 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));
