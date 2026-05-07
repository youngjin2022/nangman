// 라벨 + 입력의 표준 묶음 - 폼 일관성 유지
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-bad ml-1">*</span>}
      </label>
      {children}
      {(hint || error) && (
        <p className={cn('text-xs', error ? 'text-bad' : 'text-ink-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full h-11 px-3 rounded-lg border border-line bg-bg-panel text-base sm:text-sm focus:outline-none focus:border-accent lg:h-10';
export const textareaClass =
  'w-full min-h-[5.5rem] p-3 rounded-lg border border-line bg-bg-panel text-base sm:text-sm focus:outline-none focus:border-accent resize-y';
export const selectClass = inputClass;
