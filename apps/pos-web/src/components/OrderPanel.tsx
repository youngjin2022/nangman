// 우측 메인 영역 - 선택된 테이블 상세, 주문 목록, 액션
import { useEffect, useState } from 'react';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn, formatElapsed, formatKRW, formatTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';
import { OrderItemRow } from './OrderItemRow';
import { ConfirmDialog } from './ConfirmDialog';
import { MenuPickerDialog } from './MenuPickerDialog';
import { PaymentDialog } from './PaymentDialog';

const ORDER_STATUS_LABEL: Record<OrderStatus, { text: string; klass: string }> = {
  PENDING: { text: '확인 필요', klass: 'bg-status-pending text-white animate-pulse-soft' },
  CONFIRMED: { text: '확인됨', klass: 'bg-bg-subtle text-ink' },
  PREPARING: { text: '조리중', klass: 'bg-status-pending/20 text-status-pending' },
  SERVED: { text: '서빙완료', klass: 'bg-status-occupied/20 text-status-occupied' },
  COMPLETED: { text: '결제완료', klass: 'bg-accent/15 text-accent' },
  CANCELLED: { text: '취소', klass: 'bg-bg-subtle text-ink-muted line-through' },
};

export function OrderPanel() {
  const detail = useTablesStore((s) => s.selectedDetail);
  const selectedId = useTablesStore((s) => s.selectedTableId);
  const confirmAction = useTablesStore((s) => s.confirmOrderAction);
  const cancelAction = useTablesStore((s) => s.cancelOrderAction);
  const clearTableAction = useTablesStore((s) => s.clearTableAction);
  const pushToast = useNotificationStore((s) => s.push);

  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // 테이블 변경 시 다이얼로그 닫기
  useEffect(() => {
    setShowAdd(false);
    setShowPay(false);
    setConfirmCancel(null);
    setConfirmClear(false);
  }, [selectedId]);

  // 빈 상태 - 테이블 미선택
  if (!selectedId) {
    return (
      <div className="h-full flex items-center justify-center text-ink-muted">
        <div className="text-center">
          <div className="text-5xl mb-2">📋</div>
          <p className="text-sm">목록에서 테이블을 선택하세요</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-full flex items-center justify-center text-ink-muted">
        <div className="w-8 h-8 border-4 border-line border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const { table, orders, totalAmount } = detail;
  const isAvailable = table.status === 'AVAILABLE';
  const unpaidOrders = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED');
  const unpaidIds = unpaidOrders.map((o) => o.id);

  return (
    <div className="h-full flex flex-col bg-bg">
      {/* 상단: 테이블 정보 + 액션 버튼 */}
      <div className="px-4 lg:px-6 py-3 lg:py-4 bg-bg-panel border-b border-line">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            {/* 모바일 뒤로가기 버튼 (테이블 그리드로 복귀) */}
            <button
              onClick={() => useTablesStore.getState().selectTable(null)}
              className="lg:hidden -ml-1 mt-0.5 w-11 h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-bg-subtle active:scale-95"
              aria-label="뒤로"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                <h2 className="text-xl lg:text-2xl font-bold truncate">{table.tableName}</h2>
                <span
                  className={cn(
                    'px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-md text-[11px] lg:text-xs font-semibold',
                    isAvailable ? 'bg-bg-subtle text-ink-muted' : 'bg-status-occupied/15 text-status-occupied',
                  )}
                >
                  {isAvailable ? '비어있음' : '사용중'}
                </span>
              </div>
              {!isAvailable && table.occupiedSince && (
                <p className="text-xs lg:text-sm text-ink-muted mt-0.5 lg:mt-1">
                  점유 {formatTime(table.occupiedSince)} · 경과 {formatElapsed(table.occupiedSince)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 - 모바일에서는 풀폭 3등분 그리드 */}
        <div className="mt-3 grid grid-cols-3 gap-2 lg:flex lg:justify-end">
          <button
            onClick={() => setShowAdd(true)}
            disabled={isAvailable}
            className="h-11 px-2 lg:px-4 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dark active:scale-95 disabled:opacity-50"
          >
            + 추가
          </button>
          <button
            onClick={() => setShowPay(true)}
            disabled={unpaidIds.length === 0}
            className="h-11 px-2 lg:px-4 rounded-xl bg-status-occupied text-white text-sm font-medium hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            결제하기
          </button>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={isAvailable}
            className="h-11 px-2 lg:px-4 rounded-xl bg-bg-subtle text-ink text-sm font-medium hover:bg-line active:scale-95 disabled:opacity-50"
          >
            퇴석 처리
          </button>
        </div>

        {/* 합계 요약 */}
        <div className="mt-3 lg:mt-4 grid grid-cols-3 gap-2 lg:gap-3">
          <SummaryStat label="주문 건수" value={`${orders.length}건`} />
          <SummaryStat label="총 항목" value={`${table.totalItemCount}개`} />
          <SummaryStat
            label="미결제 합계"
            value={formatKRW(totalAmount)}
            highlight
          />
        </div>
      </div>

      {/* 주문 리스트 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 lg:px-6 py-3 lg:py-4 space-y-2 lg:space-y-3">
        {orders.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-muted text-sm">
            주문 내역이 없습니다
          </div>
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onConfirm={async () => {
                await confirmAction(o.id);
                pushToast({ kind: 'success', title: `주문 #${o.orderNumber} 확인됨` });
              }}
              onCancel={() => setConfirmCancel(o.id)}
            />
          ))
        )}
      </div>

      {/* 다이얼로그들 */}
      <MenuPickerDialog
        open={showAdd}
        tableId={selectedId}
        onClose={() => setShowAdd(false)}
      />
      <PaymentDialog
        open={showPay}
        tableId={selectedId}
        amount={totalAmount}
        unpaidOrderIds={unpaidIds}
        onClose={() => setShowPay(false)}
        onPaid={() => {
          setShowPay(false);
          // 결제 후 즉시 퇴석 처리 안내
          setConfirmClear(true);
        }}
      />
      <ConfirmDialog
        open={!!confirmCancel}
        title="주문을 취소할까요?"
        description="취소된 주문은 복구할 수 없으며, 매출에서도 제외됩니다."
        confirmText="취소 처리"
        destructive
        onConfirm={async () => {
          if (confirmCancel) {
            await cancelAction(confirmCancel);
            pushToast({ kind: 'warn', title: '주문이 취소되었습니다' });
          }
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />
      <ConfirmDialog
        open={confirmClear}
        title={`${table.tableName} 퇴석 처리`}
        description="결제가 완료된 주문만 정리되고, 테이블이 비어있음으로 변경됩니다."
        confirmText="퇴석 처리"
        onConfirm={async () => {
          await clearTableAction(selectedId);
          setConfirmClear(false);
          pushToast({ kind: 'info', title: '테이블이 정리되었습니다' });
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('p-2 lg:p-3 rounded-xl min-w-0', highlight ? 'bg-accent/10' : 'bg-bg-subtle')}>
      <div className="text-[10px] lg:text-[11px] text-ink-muted">{label}</div>
      <div
        className={cn(
          'text-sm lg:text-base font-bold mt-0.5 tabular-nums truncate',
          highlight && 'text-accent',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onConfirm,
  onCancel,
}: {
  order: Order;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { text, klass } = ORDER_STATUS_LABEL[order.status];
  const isPending = order.status === 'PENDING';
  const cancellable = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';

  return (
    <div
      className={cn(
        'bg-bg-panel rounded-2xl border p-3 lg:p-4',
        isPending ? 'border-status-pending shadow-md' : 'border-line',
      )}
    >
      {/* 모바일에서는 메타 정보와 액션을 세로로 분리해 좁은 화면에서도 줄넘김 안 되게 */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap min-w-0">
          <span className={cn('text-[11px] px-2 py-0.5 rounded font-semibold', klass)}>{text}</span>
          <span className="text-xs lg:text-sm font-semibold tabular-nums">#{order.orderNumber}</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              order.orderType === 'CUSTOMER' ? 'bg-accent/10 text-accent' : 'bg-bg-subtle text-ink-muted',
            )}
          >
            {order.orderType === 'CUSTOMER' ? '손님' : '직원'}
          </span>
          <span className="text-[11px] lg:text-xs text-ink-muted">{formatTime(order.requestedAt)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPending && (
            <button
              onClick={onConfirm}
              className="h-11 lg:h-8 min-w-[44px] px-3 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-dark active:scale-95"
            >
              확인
            </button>
          )}
          {cancellable && (
            <button
              onClick={onCancel}
              className="h-11 lg:h-8 min-w-[44px] px-3 rounded-lg border border-line text-xs font-medium hover:bg-bg-subtle active:scale-95"
            >
              취소
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 divide-y divide-line">
        {order.items.map((it) => (
          <OrderItemRow key={it.id} item={it} />
        ))}
      </div>

      {order.memo && (
        <div className="mt-2 p-2 rounded-lg bg-bg-subtle text-xs text-ink-muted">
          요청사항: {order.memo}
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-line flex justify-between text-sm">
        <span className="text-ink-muted">소계</span>
        <span className="font-semibold tabular-nums">{formatKRW(order.subtotal)}</span>
      </div>
    </div>
  );
}
