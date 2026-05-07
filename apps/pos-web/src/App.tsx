// POS 메인 화면 - 데스크톱: 좌측 사이드바 + 우측 패널 / 모바일: 테이블 그리드 → 선택 시 OrderPanel 풀스크린
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { TableGrid } from '@/components/TableGrid';
import { OrderPanel } from '@/components/OrderPanel';
import { ToastHost } from '@/components/ToastHost';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { subscribeRealtime } from '@/lib/socket';
import { cn } from '@/lib/utils';

export default function App() {
  const loadInitial = useTablesStore((s) => s.loadInitial);
  const refreshTables = useTablesStore((s) => s.refreshTables);
  const refreshSelected = useTablesStore((s) => s.refreshSelected);
  const selectedTableId = useTablesStore((s) => s.selectedTableId);
  const pushToast = useNotificationStore((s) => s.push);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const unsub = subscribeRealtime((e) => {
      if (e.type === 'order.created') {
        pushToast({
          kind: 'warn',
          title: '신규 주문이 들어왔습니다',
          message: `주문 #${e.order.orderNumber} · ${e.order.items.length}개 항목`,
          tableId: e.tableId,
        });
        refreshTables();
        refreshSelected();
      }
    });
    return unsub;
  }, [pushToast, refreshTables, refreshSelected]);

  return (
    <div className="h-full flex flex-col">
      <Header />

      <div className="flex-1 flex min-h-0 relative">
        {/* 사이드바(테이블 그리드) - 모바일은 풀폭, 데스크톱은 320px 고정 */}
        <aside
          className={cn(
            'w-full lg:w-[320px] lg:shrink-0 lg:border-r border-line bg-bg-panel',
            // 모바일: OrderPanel 오버레이 떴을 때는 사이드바 숨김 (배경 스크롤 방지)
            selectedTableId && 'hidden lg:block',
          )}
        >
          <TableGrid />
        </aside>

        {/* 주문 패널 - 데스크톱: 우측 영역 / 모바일: 풀스크린 오버레이 */}
        <main
          className={cn(
            'flex-1 min-w-0 bg-bg',
            // 모바일: 테이블 미선택 시 숨김, 선택 시 풀스크린 오버레이
            !selectedTableId && 'hidden lg:block',
            selectedTableId &&
              'fixed inset-0 top-14 z-30 lg:relative lg:inset-auto lg:top-auto lg:z-auto',
          )}
        >
          <OrderPanel />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
