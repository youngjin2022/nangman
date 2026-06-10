// 모바일 전용 하단 고정 네비게이션 - 테이블 현황 / 주문 내역 / 직접 주문
// PC(lg 이상)에서는 표시하지 않음
import { cn } from '@/lib/utils';
import type { MobileView } from './MobileViews';

interface BottomNavProps {
  active: MobileView;
  onChange: (view: MobileView) => void;
  pendingCount: number;
}

const ITEMS: Array<{ id: MobileView; label: string; icon: string }> = [
  { id: 'tables', label: '테이블 현황', icon: '🍽️' },
  { id: 'history', label: '주문 내역', icon: '🧾' },
  { id: 'direct', label: '직접 주문', icon: '➕' },
];

export function BottomNav({ active, onChange, pendingCount }: BottomNavProps) {
  return (
    <nav className="lg:hidden safe-bottom shrink-0 border-t border-line bg-bg-panel grid grid-cols-3">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'relative flex flex-col items-center justify-center gap-0.5 h-14 min-h-[48px] text-xs font-medium active:bg-bg-subtle',
            active === item.id ? 'text-accent' : 'text-ink-muted',
          )}
        >
          <span className="relative text-lg leading-none">
            {item.icon}
            {item.id === 'history' && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-status-pending text-white text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
