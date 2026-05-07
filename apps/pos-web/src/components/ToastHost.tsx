// 우상단 토스트 컨테이너 - 신규 주문 알림 등 표시
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useTablesStore } from '@/lib/store/tablesStore';
import { cn } from '@/lib/utils';

const KIND_STYLES: Record<string, string> = {
  info: 'bg-bg-panel border-line',
  success: 'bg-status-occupied/10 border-status-occupied/30',
  warn: 'bg-status-pending/10 border-status-pending/30',
  error: 'bg-red-50 border-red-300',
};

const KIND_ICONS: Record<string, string> = {
  info: 'ℹ️',
  success: '✓',
  warn: '⚠',
  error: '✕',
};

export function ToastHost() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const select = useTablesStore((s) => s.selectTable);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-3 right-3 z-50 space-y-2 w-auto max-w-md mx-auto sm:left-auto sm:right-4 sm:mx-0 sm:w-80 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            if (t.tableId) select(t.tableId);
            dismiss(t.id);
          }}
          className={cn(
            'pointer-events-auto w-full text-left p-3 rounded-xl border shadow-lg animate-slide-in-right',
            KIND_STYLES[t.kind],
          )}
        >
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">{KIND_ICONS[t.kind]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              {t.message && <div className="text-xs text-ink-muted mt-0.5">{t.message}</div>}
              {t.tableId && (
                <div className="text-[11px] text-accent mt-1 font-medium">
                  클릭해 해당 테이블로 이동 →
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
