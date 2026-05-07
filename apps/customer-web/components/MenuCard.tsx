'use client';

// 메뉴 카드 - 품절 시 비활성화 + 오버레이
import type { Menu } from '@/lib/types';
import { cn, formatKRW } from '@/lib/utils';

interface MenuCardProps {
  menu: Menu;
  onClick: (menu: Menu) => void;
}

export function MenuCard({ menu, onClick }: MenuCardProps) {
  const disabled = menu.isSoldOut;

  return (
    <button
      onClick={() => !disabled && onClick(menu)}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 bg-bg-card rounded-2xl border border-line',
        'transition active:scale-[0.98]',
        disabled && 'opacity-50',
      )}
    >
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold truncate">{menu.name}</h3>
            {disabled && (
              <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                품절
              </span>
            )}
          </div>
          {menu.description && (
            <p className="text-xs text-muted mt-1 line-clamp-2">{menu.description}</p>
          )}
          <p className="text-sm font-semibold text-accent mt-2">{formatKRW(menu.price)}</p>
        </div>
        {/* 이미지 자리 (placeholder) - 실 운영 시 menu.imageUrl 사용 */}
        <div className="shrink-0 w-20 h-20 rounded-xl bg-bg-elevated flex items-center justify-center">
          {menu.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={menu.imageUrl}
              alt={menu.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-2xl">🍶</span>
          )}
        </div>
      </div>
    </button>
  );
}
