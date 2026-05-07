// 범용 모달 - 폼 다이얼로그용
import { useEffect } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 animate-fade-in">
      <div className={`w-full ${WIDTHS[width]} bg-bg-panel rounded-2xl shadow-xl animate-slide-up flex flex-col max-h-[90vh]`}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-subtle">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}
