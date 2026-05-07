// 테이블 그리드
// 모바일·태블릿(~1023): 2열 / 데스크톱 사이드바(1024~): 좁은 폭이라 3열
import { useTablesStore } from '@/lib/store/tablesStore';
import { TableCard } from './TableCard';

export function TableGrid() {
  const tables = useTablesStore((s) => s.tables);
  const selectedId = useTablesStore((s) => s.selectedTableId);
  const select = useTablesStore((s) => s.selectTable);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-3 lg:p-4">
      <div className="text-xs font-semibold text-ink-muted mb-2 lg:mb-3 px-1">테이블 현황</div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
        {tables.map((t) => (
          <TableCard
            key={t.tableId}
            table={t}
            selected={t.tableId === selectedId}
            onClick={() => select(t.tableId)}
          />
        ))}
      </div>
      {tables.length === 0 && (
        <div className="text-center text-ink-muted text-sm py-10">테이블이 없습니다</div>
      )}
    </div>
  );
}
