// 대시보드 - 오늘의 요약, 메뉴/테이블 현황, 빠른 진입
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useMenusStore } from '@/lib/store/menusStore';
import { useTablesStore } from '@/lib/store/tablesStore';
import { getDailySales } from '@/lib/api';
import type { DailySalesData } from '@/lib/types';
import { formatKRW, formatNumber, todayISO } from '@/lib/utils';

export function DashboardPage() {
  const [today, setToday] = useState<DailySalesData | null>(null);
  const menus = useMenusStore((s) => s.menus);
  const tables = useTablesStore((s) => s.tables);
  const loadMenus = useMenusStore((s) => s.load);
  const loadTables = useTablesStore((s) => s.load);

  useEffect(() => {
    loadMenus();
    loadTables();
    getDailySales(todayISO()).then(setToday);
  }, [loadMenus, loadTables]);

  const soldOutCount = menus.filter((m) => m.isSoldOut).length;

  return (
    <div>
      <PageHeader title="대시보드" description={`${todayISO()} 기준 운영 현황`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="오늘 매출" value={today ? formatKRW(today.totalRevenue) : '-'} highlight />
        <StatCard label="오늘 주문" value={today ? `${formatNumber(today.totalOrders)}건` : '-'} />
        <StatCard label="등록 메뉴" value={`${menus.length}개`} delta={soldOutCount > 0 ? `품절 ${soldOutCount}개` : ''} />
        <StatCard label="등록 테이블" value={`${tables.filter((t) => t.isActive).length}개`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Link
          to="/menus"
          className="block p-4 sm:p-5 bg-bg-panel rounded-2xl border border-line hover:border-accent active:border-accent/80 transition touch-manipulation active:scale-[0.99]"
        >
          <div className="text-2xl mb-2">🍽️</div>
          <div className="text-base font-bold">메뉴 관리</div>
          <div className="text-xs text-ink-muted mt-1">메뉴·카테고리 추가/수정/삭제, 품절 토글</div>
        </Link>
        <Link
          to="/tables"
          className="block p-4 sm:p-5 bg-bg-panel rounded-2xl border border-line hover:border-accent active:border-accent/80 transition touch-manipulation active:scale-[0.99]"
        >
          <div className="text-2xl mb-2">🪑</div>
          <div className="text-base font-bold">테이블·QR</div>
          <div className="text-xs text-ink-muted mt-1">테이블 CRUD + QR 발급/재발급/A4 인쇄</div>
        </Link>
        <Link
          to="/sales/daily"
          className="block p-4 sm:p-5 bg-bg-panel rounded-2xl border border-line hover:border-accent active:border-accent/80 transition touch-manipulation active:scale-[0.99]"
        >
          <div className="text-2xl mb-2">📈</div>
          <div className="text-base font-bold">매출 분석</div>
          <div className="text-xs text-ink-muted mt-1">일·월별 매출, 결제수단·베스트셀러</div>
        </Link>
      </div>

      {soldOutCount > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-warn/10 border border-warn/30 text-sm">
          <strong className="text-warn">품절 메뉴 {soldOutCount}개</strong>
          <span className="text-ink-muted ml-2">손님 화면에서 비활성화됩니다.</span>
          <Link to="/menus" className="ml-2 text-accent font-medium hover:underline">관리하기 →</Link>
        </div>
      )}
    </div>
  );
}
