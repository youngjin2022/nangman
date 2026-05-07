// 대시보드 통계 카드
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, delta, highlight }: StatCardProps) {
  return (
    <div className={cn('p-5 rounded-2xl border', highlight ? 'bg-accent/5 border-accent/30' : 'bg-bg-panel border-line')}>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={cn('text-2xl font-bold mt-1.5 tabular-nums', highlight && 'text-accent')}>
        {value}
      </div>
      {delta && <div className="text-[11px] text-ink-muted mt-1">{delta}</div>}
    </div>
  );
}
