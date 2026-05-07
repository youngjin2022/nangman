// 페이지 상단 - 제목 + 우측 액션 영역
interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
