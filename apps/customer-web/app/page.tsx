// 루트 진입 - 세션이 없으면 안내, 있으면 메뉴로 이동
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store/sessionStore';
import { DEMO_QR_TOKENS } from '@/lib/mockData';

export default function HomePage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (session) router.replace('/menu');
  }, [session, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🍶</div>
      <h1 className="text-2xl font-bold mb-2">낭만포차 모바일 주문</h1>
      <p className="text-sm text-muted mb-8">
        테이블 위 QR코드를 스캔해 주세요
      </p>
      {/* 데모용 링크 - 실서비스에서는 제거 */}
      <div className="space-y-2 w-full max-w-xs">
        <p className="text-xs text-muted">데모용 진입 (시드된 테이블)</p>
        {DEMO_QR_TOKENS.map((t) => (
          <Link
            key={t}
            href={`/t/${t}`}
            className="block w-full py-3 px-4 bg-bg-card rounded-xl border border-line text-sm active:opacity-70"
          >
            /t/{t}
          </Link>
        ))}
      </div>
    </main>
  );
}
