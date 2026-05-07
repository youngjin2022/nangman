// 메뉴 관리 메인 페이지 - 좌(메뉴 테이블) + 우(카테고리 매니저)
import { useEffect, useState } from 'react';
import { useMenusStore } from '@/lib/store/menusStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn, formatKRW } from '@/lib/utils';
import type { Menu } from '@/lib/types';
import { MenuFormModal } from './MenuFormModal';
import { CategoryManager } from './CategoryManager';

export function MenusPage() {
  const load = useMenusStore((s) => s.load);
  const menus = useMenusStore((s) => s.menus);
  const categories = useMenusStore((s) => s.categories);
  const loading = useMenusStore((s) => s.loading);
  const addMenu = useMenusStore((s) => s.addMenu);
  const patchMenu = useMenusStore((s) => s.patchMenu);
  const removeMenu = useMenusStore((s) => s.removeMenu);
  const toggleSoldOut = useMenusStore((s) => s.toggleSoldOut);
  const pushToast = useNotificationStore((s) => s.push);

  const [filterCat, setFilterCat] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<Menu | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Menu | null>(null);

  useEffect(() => { load(); }, [load]);

  const filtered = menus.filter((m) => {
    const matchCat = filterCat === 'all' || m.categoryId === filterCat;
    const matchKw = !keyword || m.name.toLowerCase().includes(keyword.toLowerCase());
    return matchCat && matchKw;
  });

  const catNameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? '-';

  return (
    <div>
      <PageHeader
        title="메뉴 관리"
        description="메뉴 추가·수정·삭제, 품절 토글, 카테고리 관리"
        right={
          <button
            onClick={() => setEditing('new')}
            className="h-11 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark active:opacity-95 w-full sm:w-auto shrink-0"
          >
            + 메뉴 추가
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        {/* 메뉴 테이블 */}
        <section className="bg-bg-panel rounded-2xl border border-line">
          {/* 필터 바 */}
          <div className="p-3 sm:p-4 border-b border-line flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="h-11 w-full sm:w-auto min-w-0 sm:min-w-[140px] px-3 rounded-lg border border-line text-base sm:text-sm shrink-0"
            >
              <option value="all">전체 카테고리</option>
              {[...categories].sort((a, b) => a.displayOrder - b.displayOrder).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="메뉴명 검색"
              className="flex-1 min-w-0 min-h-11 px-3 rounded-lg border border-line text-base sm:text-sm"
            />
            <span className="text-xs text-ink-muted ml-auto">
              {loading ? '불러오는 중…' : `${filtered.length}개 / 전체 ${menus.length}개`}
            </span>
          </div>

          {/* 모바일·태블릿: 카드 */}
          <div className="lg:hidden divide-y divide-line px-4 pb-1">
            {filtered.map((m) => (
              <div key={m.id} className={cn('py-4', m.isSoldOut && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[15px] leading-snug">{m.name}</div>
                    {m.description && (
                      <div className="text-xs text-ink-muted mt-0.5 line-clamp-2">{m.description}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-ink-muted">
                      <span>{catNameOf(m.categoryId)}</span>
                      <span className="tabular-nums font-semibold text-ink">{formatKRW(m.price)}</span>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={m.isSoldOut}
                    onChange={async (v) => {
                      await toggleSoldOut(m.id, v);
                      pushToast({
                        kind: v ? 'warn' : 'info',
                        title: v ? '품절 처리됨' : '품절 해제됨',
                        message: m.name,
                      });
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    className="flex-1 h-11 rounded-xl bg-bg-subtle text-sm font-medium active:bg-line"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(m)}
                    className="flex-1 h-11 rounded-xl border border-bad/30 text-bad text-sm font-medium active:bg-bad/10"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="text-center py-10 text-ink-muted text-sm">메뉴가 없습니다</div>
            )}
          </div>

          {/* 데스크톱: 테이블 */}
          <div className="hidden lg:block overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-bg-subtle text-ink-muted text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">메뉴</th>
                  <th className="text-left px-4 py-2 font-medium">카테고리</th>
                  <th className="text-right px-4 py-2 font-medium">가격</th>
                  <th className="text-center px-4 py-2 font-medium">품절</th>
                  <th className="text-right px-4 py-2 font-medium w-32">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((m) => (
                  <tr key={m.id} className={cn('hover:bg-bg-subtle/50', m.isSoldOut && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.name}</div>
                      {m.description && (
                        <div className="text-xs text-ink-muted mt-0.5 line-clamp-1">{m.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{catNameOf(m.categoryId)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatKRW(m.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <ToggleSwitch
                        checked={m.isSoldOut}
                        onChange={async (v) => {
                          await toggleSoldOut(m.id, v);
                          pushToast({
                            kind: v ? 'warn' : 'info',
                            title: v ? '품절 처리됨' : '품절 해제됨',
                            message: m.name,
                          });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(m)}
                        className="h-8 px-3 rounded text-xs hover:bg-line"
                      >수정</button>
                      <button
                        onClick={() => setDeleteTarget(m)}
                        className="h-8 px-3 rounded text-xs text-bad hover:bg-bad/10"
                      >삭제</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-ink-muted text-sm">
                      메뉴가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 카테고리 매니저 */}
        <aside><CategoryManager /></aside>
      </div>

      {/* 모달들 */}
      <MenuFormModal
        open={editing !== null}
        initial={editing === 'new' ? null : editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          if (editing && editing !== 'new') {
            await patchMenu(editing.id, data);
            pushToast({ kind: 'success', title: '메뉴 수정됨', message: data.name });
          } else {
            await addMenu(data);
            pushToast({ kind: 'success', title: '메뉴 추가됨', message: data.name });
          }
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 메뉴 삭제`}
        description="삭제 후 복구할 수 없습니다.\n과거 주문 기록은 메뉴 스냅샷이 보존되어 영향 없습니다."
        destructive
        confirmText="삭제"
        onConfirm={async () => {
          if (deleteTarget) {
            await removeMenu(deleteTarget.id);
            pushToast({ kind: 'success', title: '메뉴 삭제됨', message: deleteTarget.name });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// 인라인 토글 스위치
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition',
        checked ? 'bg-bad' : 'bg-line',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition',
          checked ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  );
}
