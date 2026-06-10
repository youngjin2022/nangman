// 전역 비활성 감지 - 장바구니 자동 초기화 + 세션 타임아웃 처리
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useSessionStore } from '@/lib/store/sessionStore';

// 마지막 액션 후 10분 경과 시 장바구니 초기화 (3초 전 경고 토스트)
const CART_CLEAR_MS = 10 * 60 * 1000;
const CART_WARN_MS = CART_CLEAR_MS - 3000;

// 완전 비활성 30분 시 홈 화면으로 강제 복귀 + 장바구니 초기화
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = ['touchstart', 'mousemove', 'click'] as const;

export function ActivityWatcher() {
  const router = useRouter();
  const [showCartWarning, setShowCartWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const cartWarnedRef = useRef(false);

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (cartWarnedRef.current) {
        cartWarnedRef.current = false;
        setShowCartWarning(false);
      }
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= SESSION_TIMEOUT_MS) {
        useCartStore.getState().clear();
        cartWarnedRef.current = false;
        setShowCartWarning(false);
        lastActivityRef.current = Date.now();
        const session = useSessionStore.getState().session;
        router.replace(session ? `/t/${session.qrToken}` : '/');
        return;
      }

      if (elapsed >= CART_CLEAR_MS) {
        useCartStore.getState().clear();
        cartWarnedRef.current = false;
        setShowCartWarning(false);
        return;
      }

      if (elapsed >= CART_WARN_MS && !cartWarnedRef.current) {
        cartWarnedRef.current = true;
        setShowCartWarning(true);
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [router]);

  if (!showCartWarning) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-bg-elevated border border-line text-sm text-white shadow-lg animate-fade-in">
      장바구니가 곧 초기화됩니다
    </div>
  );
}
