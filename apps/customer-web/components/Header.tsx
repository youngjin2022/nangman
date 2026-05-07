'use client';

// 상단 헤더 - 매장명 + 테이블명 + (옵션) 뒤로가기
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/store/sessionStore';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export function Header({ title, showBack = false, rightSlot }: HeaderProps) {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);

  return (
    <header className="safe-top sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="-ml-2 p-2 active:opacity-60"
              aria-label="뒤로가기"
            >
              {/* 좌측 화살표 SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <div className={cn('text-base font-semibold truncate', !title && 'text-white')}>
              {title ?? session?.storeName ?? '낭만포차'}
            </div>
            {!title && session && (
              <div className="text-xs text-muted truncate">{session.tableName}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
}
