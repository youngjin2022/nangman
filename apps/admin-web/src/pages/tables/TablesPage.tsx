// 테이블·QR 관리 - 테이블 CRUD + QR 발급/회전
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTablesStore } from '@/lib/store/tablesStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QrCodeImg } from '@/components/QrCodeImg';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/useMediaQuery';
import type { AdminTable } from '@/lib/types';
import { TableFormModal } from './TableFormModal';

const CUSTOMER_BASE = import.meta.env.VITE_CUSTOMER_BASE_URL ?? 'http://localhost:3000';
const qrUrlOf = (token: string) => `${CUSTOMER_BASE}/t/${token}`;

export function TablesPage() {
  const narrowQr = useMediaQuery('(max-width: 1023px)');
  const tables = useTablesStore((s) => s.tables);
  const loading = useTablesStore((s) => s.loading);
  const load = useTablesStore((s) => s.load);
  const add = useTablesStore((s) => s.add);
  const patch = useTablesStore((s) => s.patch);
  const remove = useTablesStore((s) => s.remove);
  const rotateQr = useTablesStore((s) => s.rotateQr);
  const pushToast = useNotificationStore((s) => s.push);

  const [editing, setEditing] = useState<AdminTable | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTable | null>(null);
  const [rotateTarget, setRotateTarget] = useState<AdminTable | null>(null);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="테이블·QR 관리"
        description="테이블 추가·수정·삭제, QR 토큰 발급·회전, A4 인쇄"
        right={
          <>
            <Link
              to="/tables/qr-print"
              className="h-11 px-4 rounded-lg bg-bg-panel border border-line text-sm font-medium hover:bg-bg-subtle active:bg-bg-subtle inline-flex items-center justify-center whitespace-nowrap"
            >
              🖨 QR 인쇄
            </Link>
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="h-11 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark active:opacity-95"
            >
              + 테이블 추가
            </button>
          </>
        }
      />

      {loading ? (
        <div className="text-sm text-ink-muted text-center py-12">불러오는 중…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className={cn('p-4 bg-bg-panel rounded-2xl border border-line', !t.isActive && 'opacity-60')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-ink-muted">#{t.number}</div>
                  <div className="text-lg font-bold mt-0.5">{t.name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{t.capacity}인 · {t.isActive ? '활성' : '비활성'}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-center px-2">
                <QrCodeImg text={qrUrlOf(t.qrToken)} size={narrowQr ? 172 : 148} className="rounded-lg shrink-0" />
              </div>
              <div className="mt-3 text-[11px] text-ink-muted truncate text-center">
                토큰: {t.qrToken}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="h-11 sm:h-10 rounded-lg bg-bg-subtle hover:bg-line active:bg-line font-medium px-1"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setRotateTarget(t)}
                  className="h-11 sm:h-10 rounded-lg bg-bg-subtle hover:bg-line active:bg-line font-medium px-1 leading-tight"
                >
                  QR재발급
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(t)}
                  className="h-11 sm:h-10 rounded-lg text-bad hover:bg-bad/10 active:bg-bad/15 font-medium px-1"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="col-span-full text-center text-ink-muted text-sm py-12">테이블이 없습니다</div>
          )}
        </div>
      )}

      <TableFormModal
        open={editing !== null}
        initial={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          if (editing && editing !== 'new') {
            await patch(editing.id, data);
            pushToast({ kind: 'success', title: '테이블 수정됨', message: data.name });
          } else {
            await add(data);
            pushToast({ kind: 'success', title: '테이블 추가됨', message: data.name });
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`'${deleteTarget?.name}' 테이블 삭제`}
        description="삭제 후 복구할 수 없습니다.\n해당 테이블의 진행 중 주문이 없는지 먼저 확인해 주세요."
        destructive
        confirmText="삭제"
        onConfirm={async () => {
          if (deleteTarget) {
            await remove(deleteTarget.id);
            pushToast({ kind: 'success', title: '테이블 삭제됨' });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!rotateTarget}
        title={`'${rotateTarget?.name}' QR 재발급`}
        description="기존 QR은 더이상 동작하지 않습니다.\n새 QR을 출력해 테이블에 부착해 주세요."
        confirmText="재발급"
        onConfirm={async () => {
          if (rotateTarget) {
            await rotateQr(rotateTarget.id);
            pushToast({ kind: 'success', title: 'QR 재발급 완료', message: rotateTarget.name });
          }
          setRotateTarget(null);
        }}
        onCancel={() => setRotateTarget(null)}
      />
    </div>
  );
}
