// POS 상단 헤더 - 매장명, 시계, 신규 주문 카운트, 직원 정보
import { useEffect, useState } from 'react';
import { useTablesStore } from '@/lib/store/tablesStore';

export function Header() {
  const tables = useTablesStore((s) => s.tables);
  const refresh = useTablesStore((s) => s.refreshTables);
  const [now, setNow] = useState(new Date());

  // 1초마다 시계 갱신
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pendingCount = tables.reduce((s, t) => s + t.pendingOrderCount, 0);
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;

  return (
    <header className="h-14 px-4 flex items-center justify-between bg-bg-panel border-b border-line">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold">낭</div>
        <div>
          <div className="text-base font-bold leading-tight">낭만포차</div>
          <div className="text-[11px] text-ink-muted leading-tight">POS · 홀</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 점유 / 미확인 요약 */}
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-occupied" />
            점유 <strong className="tabular-nums">{occupiedCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full bg-status-pending ${pendingCount > 0 ? 'animate-pulse-soft' : ''}`} />
            미확인 <strong className="tabular-nums">{pendingCount}</strong>
          </span>
        </div>

        {/* 시계 */}
        <div className="text-sm tabular-nums text-ink-muted">
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

        {/* 새로고침 */}
        <button
          onClick={() => refresh()}
          className="px-3 h-9 rounded-lg border border-line text-sm font-medium hover:bg-bg-subtle active:scale-95"
        >
          새로고침
        </button>

        {/* 직원 정보 (Mock) */}
        <div className="px-3 h-9 flex items-center gap-2 rounded-lg bg-bg-subtle text-sm">
          <span className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">김</span>
          <span className="font-medium">김홀직원</span>
        </div>
      </div>
    </header>
  );
}
