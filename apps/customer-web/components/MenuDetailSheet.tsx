'use client';

// 메뉴 상세 바텀시트 - 옵션 선택 + 수량 + 장바구니 담기
import { useEffect, useMemo, useState } from 'react';
import type { Menu, MenuOptionGroup } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { cn, formatKRW } from '@/lib/utils';
import { QuantityStepper } from './QuantityStepper';

interface MenuDetailSheetProps {
  menu: Menu | null;
  onClose: () => void;
}

export function MenuDetailSheet({ menu, onClose }: MenuDetailSheetProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  // groupId → 선택된 itemId[] (단일 선택은 배열에 1개)
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  // 메뉴 변경 시 기본값 초기화
  useEffect(() => {
    if (!menu) return;
    setQuantity(1);
    const initial: Record<string, string[]> = {};
    menu.optionGroups?.forEach((g) => {
      const defaults = g.items.filter((i) => i.isDefault).map((i) => i.id);
      initial[g.id] = defaults;
    });
    setSelected(initial);
  }, [menu]);

  // 옵션 추가금 합산된 단가 + 라인 총액
  const { unitPrice, lineTotal, isValid } = useMemo(() => {
    if (!menu) return { unitPrice: 0, lineTotal: 0, isValid: false };
    let optionAdd = 0;
    let valid = true;
    menu.optionGroups?.forEach((g) => {
      const picks = selected[g.id] ?? [];
      // 필수 그룹 검증
      if (g.isRequired && picks.length < g.minSelect) valid = false;
      if (picks.length > g.maxSelect) valid = false;
      picks.forEach((id) => {
        const item = g.items.find((i) => i.id === id);
        if (item) optionAdd += item.additionalPrice;
      });
    });
    const u = menu.price + optionAdd;
    return { unitPrice: u, lineTotal: u * quantity, isValid: valid };
  }, [menu, selected, quantity]);

  if (!menu) return null;

  const toggleOption = (group: MenuOptionGroup, itemId: string) => {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      const has = current.includes(itemId);
      let next: string[];
      if (group.maxSelect === 1) {
        // 단일 선택 - 교체
        next = has ? [] : [itemId];
      } else if (has) {
        next = current.filter((id) => id !== itemId);
      } else if (current.length < group.maxSelect) {
        next = [...current, itemId];
      } else {
        next = current;
      }
      return { ...prev, [group.id]: next };
    });
  };

  const handleAdd = () => {
    const allOptionIds = Object.values(selected).flat();
    const selectedDetails = (menu.optionGroups ?? []).flatMap((g) =>
      (selected[g.id] ?? []).map((itemId) => {
        const item = g.items.find((i) => i.id === itemId)!;
        return {
          groupId: g.id,
          groupName: g.name,
          itemId: item.id,
          itemName: item.name,
          additionalPrice: item.additionalPrice,
        };
      }),
    );
    addItem({
      menuId: menu.id,
      menuName: menu.name,
      unitPrice,
      quantity,
      selectedOptions: selectedDetails,
      optionItemIds: allOptionIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />

      {/* 시트 본문 */}
      <div className="relative w-full bg-bg rounded-t-3xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* 핸들 */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto px-5 pb-4">
          {menu.imageUrl && (
            <div className="w-full aspect-[4/3] max-h-52 mt-1 mb-4 rounded-2xl overflow-hidden bg-bg-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element -- 외부 저장소 URL */}
              <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
            </div>
          )}
          <h2 className="text-xl font-bold">{menu.name}</h2>
          {menu.description && (
            <p className="text-sm text-muted mt-1">{menu.description}</p>
          )}
          <p className="text-base font-semibold text-accent mt-2">{formatKRW(menu.price)}</p>

          {/* 옵션 그룹들 */}
          {menu.optionGroups?.map((group) => (
            <section key={group.id} className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold">{group.name}</h3>
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.5 rounded',
                    group.isRequired
                      ? 'bg-accent/20 text-accent'
                      : 'bg-bg-elevated text-muted',
                  )}
                >
                  {group.isRequired ? '필수' : '선택'}
                  {group.maxSelect > 1 && ` · 최대 ${group.maxSelect}개`}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const checked = (selected[group.id] ?? []).includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border cursor-pointer',
                        'active:opacity-70 transition',
                        checked
                          ? 'border-accent bg-accent/10'
                          : 'border-line bg-bg-card',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                            checked ? 'border-accent' : 'border-muted',
                          )}
                        >
                          {checked && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
                        </span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      {item.additionalPrice > 0 && (
                        <span className="text-sm text-muted">
                          +{formatKRW(item.additionalPrice)}
                        </span>
                      )}
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleOption(group, item.id)}
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}

          {/* 수량 */}
          <section className="mt-6 flex items-center justify-between">
            <h3 className="text-sm font-semibold">수량</h3>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </section>
        </div>

        {/* 하단 고정 액션바 */}
        <div className="safe-bottom border-t border-line p-4 bg-bg">
          <button
            disabled={!isValid}
            onClick={handleAdd}
            className={cn(
              'w-full h-13 py-4 rounded-2xl font-semibold text-base',
              'transition active:scale-[0.98]',
              isValid ? 'bg-accent text-black' : 'bg-bg-elevated text-muted',
            )}
          >
            {isValid ? `${formatKRW(lineTotal)} · 담기` : '필수 옵션을 선택해 주세요'}
          </button>
        </div>
      </div>
    </div>
  );
}
