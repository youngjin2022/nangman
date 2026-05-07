// 확인 다이얼로그 - 삭제 등 위험 액션
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description,
  confirmText = '확인', cancelText = '취소',
  destructive = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 animate-fade-in">
      <div className="w-full max-w-sm bg-bg-panel rounded-2xl p-5 shadow-xl animate-slide-up">
        <h3 className="text-base font-bold">{title}</h3>
        {description && <p className="text-sm text-ink-muted mt-2 whitespace-pre-line">{description}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="h-11 rounded-xl bg-bg-subtle font-medium hover:bg-line">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'h-11 rounded-xl font-semibold text-white',
              destructive ? 'bg-bad hover:opacity-90' : 'bg-accent hover:bg-accent-dark',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
