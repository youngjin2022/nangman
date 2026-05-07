// 카테고리 관리 - 사이드 패널형 인라인 CRUD
import { useState } from 'react';
import type { Category } from '@/lib/types';
import { useMenusStore } from '@/lib/store/menusStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { inputClass } from '@/components/FormField';

export function CategoryManager() {
  const categories = useMenusStore((s) => s.categories);
  const addCategory = useMenusStore((s) => s.addCategory);
  const patchCategory = useMenusStore((s) => s.patchCategory);
  const removeCategory = useMenusStore((s) => s.removeCategory);
  const menus = useMenusStore((s) => s.menus);
  const pushToast = useNotificationStore((s) => s.push);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.displayOrder), 0);
    await addCategory({ name, displayOrder: maxOrder + 1 });
    setNewName('');
    pushToast({ kind: 'success', title: '카테고리 추가됨', message: name });
  };

  const startEdit = (c: Category) => { setEditingId(c.id); setEditingName(c.name); };
  const saveEdit = async () => {
    if (!editingId) return;
    await patchCategory(editingId, { name: editingName.trim() });
    setEditingId(null);
    pushToast({ kind: 'success', title: '카테고리 수정됨' });
  };

  const move = async (c: Category, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((x) => x.id === c.id);
    const swap = sorted[idx + direction];
    if (!swap) return;
    await Promise.all([
      patchCategory(c.id, { displayOrder: swap.displayOrder }),
      patchCategory(swap.id, { displayOrder: c.displayOrder }),
    ]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // 카테고리에 메뉴가 있으면 차단
    const used = menus.some((m) => m.categoryId === deleteTarget.id);
    if (used) {
      pushToast({ kind: 'error', title: '삭제 불가', message: '해당 카테고리에 메뉴가 있습니다. 먼저 메뉴를 다른 카테고리로 옮기세요.' });
      setDeleteTarget(null);
      return;
    }
    await removeCategory(deleteTarget.id);
    pushToast({ kind: 'success', title: '카테고리 삭제됨' });
    setDeleteTarget(null);
  };

  const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="bg-bg-panel rounded-2xl border border-line p-4">
      <h3 className="text-sm font-bold mb-3">카테고리 관리</h3>
      <div className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="카테고리명"
          className={inputClass}
        />
        <button
          onClick={handleAdd}
          className="shrink-0 px-4 h-10 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark"
        >
          추가
        </button>
      </div>

      <ul className="space-y-1">
        {sorted.map((c, idx) => {
          const count = menus.filter((m) => m.categoryId === c.id).length;
          return (
            <li
              key={c.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-subtle"
            >
              <span className="text-xs text-ink-muted w-6 tabular-nums">#{idx + 1}</span>
              {editingId === c.id ? (
                <>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className={inputClass}
                  />
                  <button onClick={saveEdit} className="h-9 px-3 rounded-lg bg-accent text-white text-xs font-semibold">저장</button>
                  <button onClick={() => setEditingId(null)} className="h-9 px-3 rounded-lg bg-bg-subtle text-xs">취소</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <span className="text-[11px] text-ink-muted">{count}개</span>
                  <button onClick={() => move(c, -1)} disabled={idx === 0} className="w-7 h-7 rounded hover:bg-line disabled:opacity-30">↑</button>
                  <button onClick={() => move(c, 1)} disabled={idx === sorted.length - 1} className="w-7 h-7 rounded hover:bg-line disabled:opacity-30">↓</button>
                  <button onClick={() => startEdit(c)} className="h-7 px-2 rounded text-xs hover:bg-line">수정</button>
                  <button onClick={() => setDeleteTarget(c)} className="h-7 px-2 rounded text-xs text-bad hover:bg-bad/10">삭제</button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 카테고리 삭제`}
        description="삭제 후 복구할 수 없습니다."
        destructive
        confirmText="삭제"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
