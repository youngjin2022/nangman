// POS 상단 헤더 - 모바일에서는 시계·직원정보 숨기고 핵심 카운트만 노출
import { useEffect, useState } from 'react';
import { useTablesStore } from '@/lib/store/tablesStore';

export function Header() {
  const tables = useTablesStore((s) => s.tables);
  const refresh = useTablesStore((s) => s.refreshTables);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingCount = tables.reduce((s, t) => s + t.pendingOrderCount, 0);
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;

  return (
    <header className="h-14 px-3 lg:px-4 flex items-center justify-between bg-bg-panel border-b border-line shrink-0">
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-accent text-white flex items-center justify-center font-bold">낭</div>
        <div className="min-w-0">
          <div className="text-sm lg:text-base font-bold leading-tight truncate">낭만포차</div>
          <div className="text-[10px] lg:text-[11px] text-ink-muted leading-tight">POS · 홀</div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* 점유 / 미확인 - 항상 표시 (모바일은 라벨 축약) */}
        <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
          <span className="flex items-center gap-1 lg:gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-occupied" />
            <span className="hidden sm:inline">점유 </span>
            <strong className="tabular-nums">{occupiedCount}</strong>
          </span>
          <span className="flex items-center gap-1 lg:gap-1.5">
            <span className={`w-2 h-2 rounded-full bg-status-pending ${pendingCount > 0 ? 'animate-pulse-soft' : ''}`} />
            <span className="hidden sm:inline">미확인 </span>
            <strong className="tabular-nums">{pendingCount}</strong>
          </span>
        </div>

        {/* 시계 - 태블릿 이상에서만 */}
        <div className="hidden md:block text-sm tabular-nums text-ink-muted">
          {now.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </div>

        {/* 새로고침 - 모든 폭에서 노출 (터치 44px) */}
        <button
          onClick={() => refresh()}
          className="px-3 h-11 lg:h-9 rounded-lg border border-line text-xs lg:text-sm font-medium hover:bg-bg-subtle active:scale-95"
        >
          새로고침
        </button>

        {/* 직원 정보 - 데스크톱에서만 */}
        <div className="hidden lg:flex px-3 h-9 items-center gap-2 rounded-lg bg-bg-subtle text-sm">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">김</span>
          <span className="font-medium">김홀직원</span>
        </div>
      </div>
    </header>
  );
}
