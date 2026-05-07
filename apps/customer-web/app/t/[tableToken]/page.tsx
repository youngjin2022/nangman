// QR 진입 라우트 - 토큰으로 테이블 정보 조회 → 세션 저장 → 메뉴로 이동
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTableByToken } from '@/lib/api';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useCartStore } from '@/lib/store/cartStore';

export default function TableEntryPage() {
  const params = useParams<{ tableToken: string }>();
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const currentSession = useSessionStore((s) => s.session);
  const clearCart = useCartStore((s) => s.clear);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = params.tableToken;
      if (!token) {
        setError('잘못된 QR입니다');
        return;
      }
      const table = await getTableByToken(token);
      if (cancelled) return;
      if (!table) {
        setError('테이블 정보를 찾을 수 없습니다');
        return;
      }
      // 다른 테이블에서 진입한 경우 장바구니 초기화
      if (currentSession && currentSession.tableId !== table.tableId) {
        clearCart();
      }
      setSession(table);
      router.replace('/menu');
    })();
    return () => {
      cancelled = true;
    };
  }, [params.tableToken, router, setSession, currentSession, clearCart]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {error ? (
        <>
          <div className="text-4xl mb-3">😢</div>
          <p className="text-base font-medium">{error}</p>
          <p className="text-sm text-muted mt-2">직원에게 문의해 주세요</p>
        </>
      ) : (
        <>
          <div className="w-10 h-10 border-4 border-line border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted">테이블을 확인하는 중…</p>
        </>
      )}
    </main>
  );
}
