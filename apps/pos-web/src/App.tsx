// POS 메인 화면 - 좌측 테이블 그리드 + 우측 주문 패널
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { TableGrid } from '@/components/TableGrid';
import { OrderPanel } from '@/components/OrderPanel';
import { ToastHost } from '@/components/ToastHost';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { subscribeRealtime } from '@/lib/socket';

export default function App() {
  const loadInitial = useTablesStore((s) => s.loadInitial);
  const refreshTables = useTablesStore((s) => s.refreshTables);
  const refreshSelected = useTablesStore((s) => s.refreshSelected);
  const pushToast = useNotificationStore((s) => s.push);

  // 초기 로드
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // 실시간 구독 - 신규 주문 알림 + 테이블 갱신
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
        // (옵션) 알림음 재생: new Audio('/notify.mp3').play().catch(() => {});
      }
    });
    return unsub;
  }, [pushToast, refreshTables, refreshSelected]);

  return (
    <div className="h-full flex flex-col">
      <Header />

      {/* 메인 2분할 - 좌측 320px, 우측 가변 */}
      <div className="flex-1 flex min-h-0">
        <aside className="w-[320px] shrink-0 border-r border-line bg-bg-panel">
          <TableGrid />
        </aside>
        <main className="flex-1 min-w-0">
          <OrderPanel />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
