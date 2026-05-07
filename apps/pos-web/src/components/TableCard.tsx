// 테이블 1개 카드 - 모바일에서는 패딩·폰트 축소
import { useEffect, useState } from 'react';
import type { TableOverview } from '@/lib/types';
import { cn, formatElapsed, formatKRW } from '@/lib/utils';

interface TableCardProps {
  table: TableOverview;
  selected: boolean;
  onClick: () => void;
}

export function TableCard({ table, selected, onClick }: TableCardProps) {
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
        'relative w-full aspect-square rounded-xl lg:rounded-2xl p-2 lg:p-3 text-left transition border-2',
        'flex flex-col justify-between active:scale-95',
        isAvailable
          ? 'bg-bg-panel border-line text-ink-muted'
          : 'bg-bg-panel border-status-occupied text-ink',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
        hasPending && 'border-status-pending',
      )}
    >
      {/* 미확인 주문 배지 - 모바일에서는 작은 버전 */}
      {hasPending && (
        <span className="absolute -top-1.5 -right-1.5 lg:-top-2 lg:-right-2 min-w-5 lg:min-w-6 h-5 lg:h-6 px-1.5 lg:px-2 rounded-full bg-status-pending text-white text-[10px] lg:text-xs font-bold flex items-center justify-center animate-pulse-soft">
          신규 {table.pendingOrderCount}
        </span>
      )}

      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-base lg:text-lg font-bold leading-none truncate">{table.tableName}</div>
          <div className="text-[10px] lg:text-[11px] mt-1 text-ink-muted">
            {isAvailable ? '비어있음' : table.occupiedSince ? formatElapsed(table.occupiedSince) : '-'}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full mt-1',
            isAvailable ? 'bg-status-available' : 'bg-status-occupied',
          )}
        />
      </div>

      {!isAvailable && (
        <div className="min-w-0">
          <div className="text-sm lg:text-base font-bold tabular-nums truncate">{formatKRW(table.totalAmount)}</div>
          <div className="text-[10px] lg:text-[11px] text-ink-muted tabular-nums">
            {table.totalItemCount}개 항목
          </div>
        </div>
      )}
    </button>
  );
}
