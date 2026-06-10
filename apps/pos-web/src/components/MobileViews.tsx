// 모바일 하단 네비게이션의 "주문 내역" / "직접 주문" 화면
// 둘 다 기존 tablesStore/MenuPickerDialog를 그대로 활용 (백엔드/소켓 구조 변경 없음)
import { useState } from 'react';
import { useTablesStore } from '@/lib/store/tablesStore';
import { cn, formatElapsed, formatKRW } from '@/lib/utils';
import { MenuPickerDialog } from './MenuPickerDialog';

export type MobileView = 'tables' | 'history' | 'direct';

// 주문 내역 - 미확인/사용중 테이블을 모아보고 탭하면 해당 테이블 주문 패널로 이동
export function OrderHistoryView() {
  const tables = useTablesStore((s) => s.tables);
  const select = useTablesStore((s) => s.selectTable);

  const occupied = tables
    .filter((t) => t.status === 'OCCUPIED')
    .sort((a, b) => b.pendingOrderCount - a.pendingOrderCount);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-3 pb-4">
      <div className="text-xs font-semibold text-ink-muted mb-2 px-1">사용중 테이블 주문 내역</div>
      {occupied.length === 0 ? (
        <div className="text-center text-ink-muted text-sm py-10">사용중인 테이블이 없습니다</div>
      ) : (
        <div className="space-y-2">
          {occupied.map((t) => (
            <button
              key={t.tableId}
              onClick={() => select(t.tableId)}
              className={cn(
                'w-full min-h-[48px] p-3 rounded-xl border text-left active:scale-[0.99] transition',
                t.pendingOrderCount > 0
                  ? 'bg-status-pending/10 border-status-pending'
                  : 'bg-bg-panel border-line',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold truncate">{t.tableName}</span>
                  {t.pendingOrderCount > 0 && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-status-pending text-white text-[10px] font-bold animate-pulse-soft">
                      신규 {t.pendingOrderCount}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-ink-muted tabular-nums">
                  {t.occupiedSince ? formatElapsed(t.occupiedSince) : '-'}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{t.totalItemCount}개 항목</span>
                <span className="font-semibold tabular-nums">{formatKRW(t.totalAmount)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 직접 주문 - 테이블을 먼저 선택한 뒤 메뉴 입력 다이얼로그를 바로 연다
export function DirectOrderView() {
  const tables = useTablesStore((s) => s.tables);
  const [pickedTableId, setPickedTableId] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-3 pb-4">
      <div className="text-xs font-semibold text-ink-muted mb-2 px-1">
        주문을 추가할 테이블을 선택하세요
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tables.map((t) => (
          <button
            key={t.tableId}
            onClick={() => setPickedTableId(t.tableId)}
            className={cn(
              'min-h-[48px] p-3 rounded-xl border text-left active:scale-95 transition',
              t.status === 'AVAILABLE'
                ? 'bg-bg-panel border-line text-ink-muted'
                : 'bg-bg-panel border-status-occupied text-ink',
            )}
          >
            <div className="font-bold truncate">{t.tableName}</div>
            <div className="text-[11px] mt-0.5 text-ink-muted">
              {t.status === 'AVAILABLE' ? '비어있음' : '사용중'}
            </div>
          </button>
        ))}
      </div>
      {tables.length === 0 && (
        <div className="text-center text-ink-muted text-sm py-10">테이블이 없습니다</div>
      )}

      <MenuPickerDialog
        open={!!pickedTableId}
        tableId={pickedTableId}
        onClose={() => setPickedTableId(null)}
      />
    </div>
  );
}
