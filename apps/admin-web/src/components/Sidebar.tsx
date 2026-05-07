// 좌측 사이드바 - 데스크톱(lg~) 전용 고정 네비게이션
import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-56 shrink-0 border-r border-line bg-bg-panel flex-col">
      <div className="h-16 px-5 flex items-center gap-2 border-b border-line">
        <div className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center font-bold">낭</div>
        <div>
          <div className="text-sm font-bold leading-tight">낭만포차</div>
          <div className="text-[11px] text-ink-muted leading-tight">관리자</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {ADMIN_NAV_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-accent text-white' : 'text-ink hover:bg-bg-subtle active:bg-bg-subtle',
              )
            }
          >
            <span className="text-base">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <div className="px-3 py-2 rounded-lg bg-bg-subtle text-xs">
          <div className="text-ink-muted">로그인</div>
          <div className="font-semibold mt-0.5">사장님 (OWNER)</div>
        </div>
      </div>
    </aside>
  );
}
