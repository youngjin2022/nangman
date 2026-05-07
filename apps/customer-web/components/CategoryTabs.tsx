'use client';

// 가로 스크롤 카테고리 탭 - 클릭 시 해당 섹션으로 스크롤
import { useEffect, useRef, useState } from 'react';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // 활성 탭이 화면에 보이도록 자동 스크롤
  useEffect(() => {
    const el = tabRefs.current[activeId];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeId]);

  return (
    <div className="sticky top-14 z-20 bg-bg border-b border-line">
      <div
        ref={containerRef}
        className="flex gap-1 px-2 overflow-x-auto scrollbar-none"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            ref={(el) => {
              tabRefs.current[cat.id] = el;
            }}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'shrink-0 px-4 py-3 text-sm font-medium relative transition-colors',
              activeId === cat.id ? 'text-accent' : 'text-muted',
            )}
          >
            {cat.name}
            {activeId === cat.id && (
              <span className="absolute left-2 right-2 bottom-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
