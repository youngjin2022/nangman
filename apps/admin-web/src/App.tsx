// 관리자 앱 셸 - 라우팅 + 사이드바 + 토스트
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { ToastHost } from '@/components/ToastHost';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MenusPage } from '@/pages/menus/MenusPage';
import { TablesPage } from '@/pages/tables/TablesPage';
import { QrPrintPage } from '@/pages/tables/QrPrintPage';
import { DailySalesPage } from '@/pages/sales/DailySalesPage';
import { MonthlySalesPage } from '@/pages/sales/MonthlySalesPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-full flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 max-w-[1400px] mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/menus" element={<MenusPage />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/tables/qr-print" element={<QrPrintPage />} />
              <Route path="/sales/daily" element={<DailySalesPage />} />
              <Route path="/sales/monthly" element={<MonthlySalesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
      <ToastHost />
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="text-center py-20 text-ink-muted">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-base font-medium">페이지를 찾을 수 없습니다</p>
    </div>
  );
}
