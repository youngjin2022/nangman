// 모바일·태블릿(<lg) 하단 탭 바 — lg 이상에서는 숨김
import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom-nav',
        'border-t border-line bg-bg-panel/95 backdrop-blur-sm',
      )}
      aria-label="주 메뉴"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {ADMIN_NAV_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-0.5 rounded-t-lg text-[10px] font-medium tap-highlight-none',
                'active:opacity-70',
                isActive ? 'text-accent' : 'text-ink-muted',
              )
            }
          >
            <span className="text-lg leading-none mb-0.5" aria-hidden>
              {it.icon}
            </span>
            <span className="truncate w-full text-center">{it.short}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
