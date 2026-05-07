// POS 직접 추가 주문 - 우측 슬라이드 다이얼로그
// 카테고리 탭 + 메뉴 그리드 + 임시 카트 + 옵션 선택

import { useEffect, useMemo, useState } from 'react';
import type { Menu, MenuOptionGroup } from '@/lib/types';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn, formatKRW, buildLineId } from '@/lib/utils';

interface MenuPickerDialogProps {
  open: boolean;
  tableId: string | null;
  onClose: () => void;
}

type DraftLine = {
  lineId: string;
  menuId: string;
  menuName: string;
  unitPrice: number;
  quantity: number;
  options: string[];
  optionItemIds: string[];
};

export function MenuPickerDialog({ open, tableId, onClose }: MenuPickerDialogProps) {
  const categories = useTablesStore((s) => s.categories);
  const menus = useTablesStore((s) => s.menus);
  const addPosOrder = useTablesStore((s) => s.addPosOrder);
  const pushToast = useNotificationStore((s) => s.push);

  const [activeCat, setActiveCat] = useState<string>('');
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [optionMenu, setOptionMenu] = useState<Menu | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveCat(categories[0]?.id ?? '');
      setDraft([]);
      setOptionMenu(null);
    }
  }, [open, categories]);

  const filtered = useMemo(
    () => menus.filter((m) => m.categoryId === activeCat),
    [menus, activeCat],
  );

  const draftTotal = draft.reduce((s, d) => s + d.unitPrice * d.quantity, 0);

  // 옵션 없는 메뉴 → 즉시 1개 추가, 옵션 있으면 옵션 시트로
  const handleMenuClick = (m: Menu) => {
    if (m.isSoldOut) return;
    if (!m.optionGroups || m.optionGroups.length === 0) {
      addLine({
        menuId: m.id,
        menuName: m.name,
        unitPrice: m.price,
        quantity: 1,
        options: [],
        optionItemIds: [],
      });
    } else {
      setOptionMenu(m);
    }
  };

  const addLine = (line: Omit<DraftLine, 'lineId'>) => {
    const lineId = buildLineId(line.menuId, line.optionItemIds);
    setDraft((prev) => {
      const existing = prev.find((d) => d.lineId === lineId);
      if (existing) {
        return prev.map((d) => (d.lineId === lineId ? { ...d, quantity: d.quantity + line.quantity } : d));
      }
      return [...prev, { lineId, ...line }];
    });
  };

  const updateQty = (lineId: string, q: number) => {
    if (q <= 0) {
      setDraft((prev) => prev.filter((d) => d.lineId !== lineId));
      return;
    }
    setDraft((prev) => prev.map((d) => (d.lineId === lineId ? { ...d, quantity: q } : d)));
  };

  const handleSubmit = async () => {
    if (!tableId || draft.length === 0) return;
    setSubmitting(true);
    try {
      await addPosOrder(
        tableId,
        draft.map(({ menuId, menuName, unitPrice, quantity, options }) => ({
          menuId, menuName, unitPrice, quantity, options,
        })),
      );
      pushToast({ kind: 'success', title: '주문이 추가되었습니다', tableId });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 우측 패널 - 모바일은 풀폭, 데스크톱은 우측 슬라이드 */}
      <div className="relative w-full lg:max-w-[800px] h-full bg-bg-panel shadow-2xl flex flex-col lg:animate-slide-in-right">
        {/* 헤더 */}
        <div className="h-14 px-4 lg:px-5 flex items-center justify-between border-b border-line shrink-0">
          <h2 className="text-base font-bold">추가 주문 입력</h2>
          <button onClick={onClose} className="w-11 h-11 lg:w-9 lg:h-9 rounded-lg hover:bg-bg-subtle active:scale-95">✕</button>
        </div>

        {/* 본문: 데스크톱 좌우(메뉴+카트) / 모바일 상하(메뉴 위 + 카트 풋바) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* 메뉴 영역 - 모바일에서는 풀폭, 데스크톱에서는 우측 카트와 분할 */}
          <div className="flex-1 flex flex-col min-w-0 lg:border-r border-line">
            {/* 카테고리 탭 */}
            <div className="flex gap-1 px-3 py-2 border-b border-line overflow-x-auto scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={cn(
                    'shrink-0 px-3 h-11 lg:h-9 rounded-lg text-sm font-medium active:scale-95',
                    activeCat === c.id ? 'bg-accent text-white' : 'bg-bg-subtle hover:bg-line',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* 메뉴 그리드 - 모바일 2열, 태블릿 3열, 데스크톱 3열 */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMenuClick(m)}
                    disabled={m.isSoldOut}
                    className={cn(
                      'relative p-3 rounded-xl border text-left transition',
                      'min-h-[5.25rem] flex flex-col justify-between',
                      m.isSoldOut
                        ? 'bg-bg-subtle border-line opacity-50 cursor-not-allowed'
                        : 'bg-bg-panel border-line hover:border-accent active:scale-95',
                    )}
                  >
                    <div className="flex items-start gap-1">
                      <span className="text-sm font-medium leading-tight line-clamp-2">{m.name}</span>
                      {m.isSoldOut && (
                        <span className="text-[10px] px-1 rounded bg-red-100 text-red-600">품절</span>
                      )}
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatKRW(m.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 임시 카트 - 모바일에서는 하단 고정 풋바(높이 제한), 데스크톱은 우측 320px 풀높이 */}
          <div className="lg:w-80 flex flex-col bg-bg-subtle border-t lg:border-t-0 border-line max-h-[45vh] lg:max-h-none">
            <div className="px-4 py-3 border-b border-line">
              <div className="text-xs text-ink-muted">담을 항목</div>
              <div className="text-base font-bold tabular-nums">
                {draft.reduce((s, d) => s + d.quantity, 0)}개 · {formatKRW(draftTotal)}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2 min-h-0">
              {draft.length === 0 ? (
                <div className="text-center text-ink-muted text-sm py-6 lg:py-10">
                  메뉴를 클릭해 추가하세요
                </div>
              ) : (
                draft.map((d) => (
                  <div key={d.lineId} className="p-3 bg-bg-panel rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{d.menuName}</div>
                        {d.options.length > 0 && (
                          <div className="text-xs text-ink-muted mt-0.5">{d.options.join(' · ')}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(d.lineId, 0)}
                        className="w-11 h-11 lg:w-9 lg:h-9 shrink-0 flex items-center justify-center rounded-lg text-ink-muted active:bg-bg-subtle active:text-red-600 text-lg leading-none"
                        aria-label="항목 삭제"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center bg-bg-subtle rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQty(d.lineId, d.quantity - 1)}
                          className="w-11 h-11 lg:w-8 lg:h-8 flex items-center justify-center shrink-0 active:bg-line"
                        >
                          −
                        </button>
                        <span className="min-w-[2.75rem] text-center text-sm font-medium tabular-nums">{d.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(d.lineId, d.quantity + 1)}
                          className="w-11 h-11 lg:w-8 lg:h-8 flex items-center justify-center shrink-0 active:bg-line"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatKRW(d.unitPrice * d.quantity)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="safe-bottom p-3 border-t border-line">
              <button
                type="button"
                disabled={draft.length === 0 || submitting}
                onClick={handleSubmit}
                className="w-full h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-50 hover:bg-accent-dark active:scale-[0.99]"
              >
                {submitting ? '추가 중…' : `${formatKRW(draftTotal)} 주문 추가`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 옵션 선택 시트 (옵션 있는 메뉴 클릭 시) */}
      {optionMenu && (
        <OptionSheet
          menu={optionMenu}
          onClose={() => setOptionMenu(null)}
          onAdd={(line) => {
            addLine(line);
            setOptionMenu(null);
          }}
        />
      )}
    </div>
  );
}

// 옵션 선택 모달 (간소화 - POS는 빠른 입력 우선)
function OptionSheet({
  menu,
  onClose,
  onAdd,
}: {
  menu: Menu;
  onClose: () => void;
  onAdd: (line: Omit<DraftLine, 'lineId'>) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    menu.optionGroups?.forEach((g) => {
      init[g.id] = g.items.filter((_, i) => i === 0 && g.isRequired).map((i) => i.id);
    });
    return init;
  });

  const { unitPrice, valid, optionTexts, optionIds } = useMemo(() => {
    let extra = 0;
    let v = true;
    const texts: string[] = [];
    const ids: string[] = [];
    menu.optionGroups?.forEach((g) => {
      const picks = selected[g.id] ?? [];
      if (g.isRequired && picks.length < g.minSelect) v = false;
      picks.forEach((id) => {
        const item = g.items.find((i) => i.id === id);
        if (item) {
          extra += item.additionalPrice;
          texts.push(item.name);
          ids.push(item.id);
        }
      });
    });
    return { unitPrice: menu.price + extra, valid: v, optionTexts: texts, optionIds: ids };
  }, [menu, selected]);

  const toggle = (g: MenuOptionGroup, itemId: string) => {
    setSelected((prev) => {
      const cur = prev[g.id] ?? [];
      const has = cur.includes(itemId);
      let next: string[];
      if (g.maxSelect === 1) next = has ? [] : [itemId];
      else if (has) next = cur.filter((id) => id !== itemId);
      else if (cur.length < g.maxSelect) next = [...cur, itemId];
      else next = cur;
      return { ...prev, [g.id]: next };
    });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md bg-bg-panel rounded-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-line">
          <h3 className="text-lg font-bold">{menu.name}</h3>
          <p className="text-sm text-ink-muted">{formatKRW(menu.price)}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {menu.optionGroups?.map((g) => (
            <div key={g.id}>
              <div className="text-sm font-semibold mb-2">
                {g.name}
                <span className={cn('ml-2 text-[11px] px-1.5 py-0.5 rounded',
                  g.isRequired ? 'bg-accent/15 text-accent' : 'bg-bg-subtle text-ink-muted')}>
                  {g.isRequired ? '필수' : '선택'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.items.map((it) => {
                  const checked = (selected[g.id] ?? []).includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggle(g, it.id)}
                      className={cn(
                        'min-h-11 p-3 rounded-lg border text-left text-sm active:scale-[0.99]',
                        checked ? 'border-accent bg-accent/10' : 'border-line bg-bg-subtle',
                      )}
                    >
                      <div className="font-medium">{it.name}</div>
                      {it.additionalPrice > 0 && (
                        <div className="text-xs text-ink-muted mt-0.5">+{formatKRW(it.additionalPrice)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="safe-bottom p-4 border-t border-line grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-xl bg-bg-subtle font-medium active:scale-[0.99]">
            취소
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() =>
              onAdd({
                menuId: menu.id,
                menuName: menu.name,
                unitPrice,
                quantity: 1,
                options: optionTexts,
                optionItemIds: optionIds,
              })
            }
            className="h-12 rounded-xl bg-accent text-white font-semibold disabled:opacity-50 active:scale-[0.99]"
          >
            {formatKRW(unitPrice)} 추가
          </button>
        </div>
      </div>
    </div>
  );
}
