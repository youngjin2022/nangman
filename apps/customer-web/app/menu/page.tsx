// 메뉴 화면 - 카테고리 탭 + 섹션별 메뉴 리스트
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Menu } from '@/lib/types';
import { getMenuData } from '@/lib/api';
import { useSessionStore } from '@/lib/store/sessionStore';
import { useCartStore } from '@/lib/store/cartStore';
import { Header } from '@/components/Header';
import { CategoryTabs } from '@/components/CategoryTabs';
import { MenuCard } from '@/components/MenuCard';
import { MenuDetailSheet } from '@/components/MenuDetailSheet';
import { CartFloatingButton } from '@/components/CartFloatingButton';

export default function MenuPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  // 섹션 ref - 카테고리 탭 클릭 시 스크롤 + IntersectionObserver
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // 세션 없으면 루트로 (QR 재스캔 유도)
  useEffect(() => {
    if (!session) router.replace('/');
  }, [session, router]);

  // 메뉴 데이터 로드
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getMenuData(session.storeId);
      if (cancelled) return;
      setCategories(data.categories);
      setMenus(data.menus);
      setActiveCat(data.categories[0]?.id ?? '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // 카테고리별 메뉴 그룹핑
  const menusByCat = useMemo(() => {
    const map: Record<string, Menu[]> = {};
    for (const m of menus) {
      (map[m.categoryId] ||= []).push(m);
    }
    return map;
  }, [menus]);

  // 스크롤 시 활성 탭 자동 변경 (현재 화면 상단에 있는 섹션 감지)
  useEffect(() => {
    if (loading || categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // 가장 상단에 가까운 visible 섹션을 활성화
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveCat(visible.target.id);
      },
      // 헤더(56px) + 카테고리 탭(48px) 영역을 제외한 가운데 영역에서 감지
      { rootMargin: '-110px 0px -60% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [loading, categories]);

  const handleCategoryClick = (id: string) => {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) {
      // 헤더 + 탭 높이만큼 오프셋
      const top = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen pb-32">
      <Header />
      {!loading && (
        <CategoryTabs
          categories={categories}
          activeId={activeCat}
          onSelect={handleCategoryClick}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-line border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-8">
          {categories.map((cat) => (
            <section
              key={cat.id}
              id={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
            >
              <h2 className="text-lg font-bold mb-3 px-1">{cat.name}</h2>
              <div className="space-y-2">
                {(menusByCat[cat.id] ?? []).map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onClick={(m) => {
                      // 옵션이 없으면 시트 없이 즉시 1개 담기 (UX)
                      if (!m.optionGroups || m.optionGroups.length === 0) {
                        useCartStore.getState().addItem({
                          menuId: m.id,
                          menuName: m.name,
                          unitPrice: m.price,
                          quantity: 1,
                          selectedOptions: [],
                          optionItemIds: [],
                        });
                      } else {
                        setSelectedMenu(m);
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MenuDetailSheet menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
      <CartFloatingButton />
    </main>
  );
}
