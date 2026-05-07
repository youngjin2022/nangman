// 페이지 상단 - 제목 + 우측 액션 영역
interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between mb-6 min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-ink-muted mt-1 line-clamp-2 sm:line-clamp-none">{description}</p>
        )}
      </div>
      {right !== undefined && right !== null && (
        <div className="flex flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto lg:flex-nowrap lg:justify-end shrink-0 [&_button]:min-h-[44px] lg:[&_button]:min-h-0 [&_a]:min-h-[44px] lg:[&_a]:min-h-0 [&_input]:min-h-[44px] lg:[&_input]:min-h-10 [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center">{right}</div>
      )}
    </div>
  );
}
