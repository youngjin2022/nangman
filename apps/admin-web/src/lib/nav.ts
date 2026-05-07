/** 관리자 앱 라우트 네비게이션 (데스크톱 사이드바 · 모바일 하단 탭 공통) */
export const ADMIN_NAV_ITEMS: Array<{ to: string; label: string; short: string; icon: string }> = [
  { to: '/dashboard', label: '대시보드', short: '홈', icon: '📊' },
  { to: '/menus', label: '메뉴 관리', short: '메뉴', icon: '🍽️' },
  { to: '/tables', label: '테이블·QR', short: '테이블', icon: '🪑' },
  { to: '/sales/daily', label: '일별 매출', short: '일매출', icon: '📈' },
  { to: '/sales/monthly', label: '월별 매출', short: '월매출', icon: '📅' },
];
