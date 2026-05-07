// 테이블 세션 저장소 - QR 진입 시 세팅, 새로고침에도 유지 (sessionStorage)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TableSession } from '../types';

interface SessionState {
  session: TableSession | null;
  setSession: (s: TableSession) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'table-session',
      // 탭 종료 시 세션 종료 (sessionStorage 사용)
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
