// 주문 1개 항목 행 - 메뉴명, 옵션, 수량, 가격
import type { OrderItem } from '@/lib/types';
import { cn, formatKRW } from '@/lib/utils';

const STATUS_LABEL: Record<OrderItem['status'], { text: string; klass: string }> = {
  ORDERED: { text: '대기', klass: 'bg-bg-subtle text-ink-muted' },
  PREPARING: { text: '조리중', klass: 'bg-status-pending/15 text-status-pending' },
  SERVED: { text: '서빙완료', klass: 'bg-status-occupied/15 text-status-occupied' },
  CANCELLED: { text: '취소', klass: 'bg-bg-subtle text-ink-muted line-through' },
};

interface OrderItemRowProps {
  item: OrderItem;
}

export function OrderItemRow({ item }: OrderItemRowProps) {
  const { text, klass } = STATUS_LABEL[item.status];
  const cancelled = item.status === 'CANCELLED';

  return (
    <div className={cn('flex items-start justify-between py-2.5 gap-3', cancelled && 'opacity-50')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-medium', klass)}>{text}</span>
          <span className="text-sm font-medium truncate">{item.menuName}</span>
          <span className="text-sm text-ink-muted tabular-nums">× {item.quantity}</span>
        </div>
        {item.options.length > 0 && (
          <p className="text-xs text-ink-muted mt-0.5">{item.options.join(' · ')}</p>
        )}
      </div>
      <span className="text-sm font-medium tabular-nums shrink-0">
        {formatKRW(item.unitPrice * item.quantity)}
      </span>
    </div>
  );
}
