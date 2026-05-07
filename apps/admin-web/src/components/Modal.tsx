// 범용 모달 - 폼 다이얼로그용
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export function Modal({ open, title, onClose, children, footer, width = 'md' }: ModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-6 bg-black/40 animate-fade-in">
      <div
        className={cn(
          'w-full bg-bg-panel shadow-xl flex flex-col animate-slide-up',
          'h-[100dvh] max-h-[100dvh] rounded-none lg:h-auto lg:max-h-[90vh] lg:rounded-2xl',
          WIDTHS[width],
        )}
      >
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-line flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold pr-2">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 shrink-0 rounded-lg hover:bg-bg-subtle active:bg-bg-subtle text-lg leading-none flex items-center justify-center"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">{children}</div>
        {footer && <div className="safe-bottom shrink-0 px-4 pt-3 pb-3 sm:px-5 sm:pb-4 border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}
