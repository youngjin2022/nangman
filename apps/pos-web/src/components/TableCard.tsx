// 테이블 1개 카드 - 상태색, 점유시간, 합계, 미확인 배지
import { useEffect, useState } from 'react';
import type { TableOverview } from '@/lib/types';
import { cn, formatElapsed, formatKRW } from '@/lib/utils';

interface TableCardProps {
  table: TableOverview;
  selected: boolean;
  onClick: () => void;
}

export function TableCard({ table, selected, onClick }: TableCardProps) {
  // 점유 시간 1분마다 갱신
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!table.occupiedSince) return;
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [table.occupiedSince]);

  const isAvailable = table.status === 'AVAILABLE';
  const hasPending = table.pendingOrderCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full aspect-square rounded-2xl p-3 text-left transition border-2',
        'flex flex-col justify-between',
        isAvailable
          ? 'bg-bg-panel border-line text-ink-muted'
          : 'bg-bg-panel border-status-occupied text-ink',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
        hasPending && 'border-status-pending',
      )}
    >
      {/* 미확인 주문 배지 */}
      {hasPending && (
        <span className="absolute -top-2 -right-2 min-w-6 h-6 px-2 rounded-full bg-status-pending text-white text-xs font-bold flex items-center justify-center animate-pulse-soft">
          신규 {table.pendingOrderCount}
        </span>
      )}

      {/* 상단: 테이블명 + 상태 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-bold leading-none">{table.tableName}</div>
          <div className="text-[11px] mt-1 text-ink-muted">
            {isAvailable ? '비어있음' : table.occupiedSince ? formatElapsed(table.occupiedSince) : '-'}
          </div>
        </div>
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-1',
            isAvailable ? 'bg-status-available' : 'bg-status-occupied',
          )}
        />
      </div>

      {/* 하단: 합계 + 인원 */}
      {!isAvailable && (
        <div>
          <div className="text-base font-bold tabular-nums">{formatKRW(table.totalAmount)}</div>
          <div className="text-[11px] text-ink-muted tabular-nums">
            {table.totalItemCount}개 항목
          </div>
        </div>
      )}
    </button>
  );
}
