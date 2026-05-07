// 우상단 토스트
import { useNotificationStore } from '@/lib/store/notificationStore';
import { cn } from '@/lib/utils';

const KIND_STYLES: Record<string, string> = {
  info: 'bg-bg-panel border-line',
  success: 'bg-good/10 border-good/30',
  warn: 'bg-warn/10 border-warn/30',
  error: 'bg-bad/10 border-bad/30',
};

export function ToastHost() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismiss);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-3 left-3 right-3 z-[60] space-y-2 max-w-md mx-auto sm:left-auto sm:right-4 sm:mx-0 sm:w-80 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="button"
          tabIndex={0}
          onClick={() => dismiss(t.id)}
          onKeyDown={(e) => e.key === 'Enter' && dismiss(t.id)}
          className={cn(
            'pointer-events-auto p-3 rounded-xl border shadow-lg cursor-pointer animate-slide-up',
            KIND_STYLES[t.kind],
          )}
        >
          <div className="text-sm font-semibold">{t.title}</div>
          {t.message && <div className="text-xs text-ink-muted mt-0.5">{t.message}</div>}
        </div>
      ))}
    </div>
  );
}
