// 결제 처리 다이얼로그 - 결제 수단 선택 + 금액 확인
import { useState } from 'react';
import type { PaymentMethod } from '@/lib/types';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn, formatKRW } from '@/lib/utils';

interface PaymentDialogProps {
  open: boolean;
  tableId: string | null;
  amount: number;
  unpaidOrderIds: string[];
  onClose: () => void;
  onPaid: () => void;
}

const METHODS: Array<{ id: PaymentMethod; label: string; icon: string }> = [
  { id: 'CARD', label: '카드', icon: '💳' },
  { id: 'CASH', label: '현금', icon: '💵' },
  { id: 'KAKAO', label: '카카오페이', icon: '🟡' },
  { id: 'NAVER', label: '네이버페이', icon: '🟢' },
  { id: 'TOSS', label: '토스페이', icon: '🔵' },
];

export function PaymentDialog({
  open,
  tableId,
  amount,
  unpaidOrderIds,
  onClose,
  onPaid,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [processing, setProcessing] = useState(false);
  const pay = useTablesStore((s) => s.payAction);
  const pushToast = useNotificationStore((s) => s.push);

  if (!open || !tableId) return null;

  const handlePay = async () => {
    setProcessing(true);
    try {
      await pay(tableId, unpaidOrderIds, method, amount);
      pushToast({ kind: 'success', title: '결제가 완료되었습니다', message: `${formatKRW(amount)} · ${methodLabel(method)}` });
      onPaid();
    } catch {
      pushToast({ kind: 'error', title: '결제 처리 실패', message: '잠시 후 다시 시도해 주세요' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-6 bg-black/50 animate-fade-in">
      <div className="w-full lg:max-w-md bg-bg-panel rounded-t-2xl lg:rounded-2xl shadow-xl animate-slide-up max-h-[95vh] flex flex-col">
        <div className="p-4 lg:p-5 border-b border-line shrink-0">
          <h2 className="text-base lg:text-lg font-bold">결제 처리</h2>
          <p className="text-xs lg:text-sm text-ink-muted mt-1">결제 수단을 선택하세요</p>
        </div>
        <div className="p-4 lg:p-5 overflow-y-auto">
          <div className="p-3 lg:p-4 bg-bg-subtle rounded-xl mb-4 lg:mb-5">
            <div className="text-xs text-ink-muted">총 결제금액</div>
            <div className="text-xl lg:text-2xl font-bold text-accent tabular-nums mt-1">
              {formatKRW(amount)}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              주문 {unpaidOrderIds.length}건 합산
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  'h-12 lg:h-14 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-medium active:scale-95',
                  method === m.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line hover:border-ink-muted',
                )}
              >
                <span className="text-base">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="safe-bottom p-3 lg:p-4 border-t border-line grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={processing}
            className="h-12 rounded-xl bg-bg-subtle font-medium disabled:opacity-50 active:scale-95"
          >
            취소
          </button>
          <button
            onClick={handlePay}
            disabled={processing || amount <= 0}
            className="h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-50 hover:bg-accent-dark active:scale-95"
          >
            {processing ? '결제 중…' : `${formatKRW(amount)} 결제`}
          </button>
        </div>
      </div>
    </div>
  );
}

function methodLabel(m: PaymentMethod): string {
  return METHODS.find((x) => x.id === m)?.label ?? m;
}
