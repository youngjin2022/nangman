// QR 일괄 인쇄 페이지 - A4 한 장에 8개(2×4) 레이아웃, 브라우저 인쇄로 PDF 저장
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTablesStore } from '@/lib/store/tablesStore';
import { QrCodeImg } from '@/components/QrCodeImg';
import { cn } from '@/lib/utils';

const CUSTOMER_BASE = import.meta.env.VITE_CUSTOMER_BASE_URL ?? 'http://localhost:3000';
const PER_PAGE = 8; // 2×4 레이아웃

export function QrPrintPage() {
  const tables = useTablesStore((s) => s.tables);
  const load = useTablesStore((s) => s.load);
  const [layout, setLayout] = useState<'2x4' | '4x4'>('2x4');

  useEffect(() => { load(); }, [load]);

  // 활성 테이블만 인쇄
  const active = tables.filter((t) => t.isActive);
  const perPage = layout === '2x4' ? 8 : 16;
  const pages: typeof active[] = [];
  for (let i = 0; i < active.length; i += perPage) {
    pages.push(active.slice(i, i + perPage));
  }

  return (
    <div>
      {/* 인쇄 시 숨김 - 컨트롤 바 */}
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Link
          to="/tables"
          className="h-10 px-4 rounded-lg bg-bg-panel border border-line text-sm font-medium hover:bg-bg-subtle inline-flex items-center"
        >
          ← 테이블 목록
        </Link>
        <h1 className="text-lg font-bold ml-2">QR 인쇄 미리보기</h1>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as '2x4' | '4x4')}
            className="h-10 px-3 rounded-lg border border-line text-sm"
          >
            <option value="2x4">A4 한 장에 8개 (2×4 - 큰 사이즈)</option>
            <option value="4x4">A4 한 장에 16개 (4×4 - 작은 사이즈)</option>
          </select>
          <button
            onClick={() => window.print()}
            className="h-10 px-5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-dark"
          >
            🖨 인쇄 / PDF로 저장
          </button>
        </div>
      </div>

      <div className="no-print mb-4 p-3 rounded-lg bg-bg-panel border border-line text-xs text-ink-muted">
        브라우저 인쇄 대화상자에서 <strong>"PDF로 저장"</strong>을 선택하면 파일로 받을 수 있습니다.
        여백은 <strong>"기본값"</strong>, 배율은 <strong>"100%"</strong> 권장.
      </div>

      {pages.length === 0 ? (
        <div className="text-center text-ink-muted py-20">활성 테이블이 없습니다</div>
      ) : (
        pages.map((tablesOnPage, pIdx) => (
          <section
            key={pIdx}
            className={cn(
              'print-page bg-white shadow border border-line mx-auto mb-6',
              'w-[210mm] min-h-[297mm] p-[15mm]',
            )}
          >
            <header className="flex items-center justify-between mb-6 pb-3 border-b border-line">
              <div>
                <div className="text-xl font-bold text-black">낭만포차</div>
                <div className="text-xs text-ink-muted">QR 코드를 스캔해 주문하세요</div>
              </div>
              <div className="text-xs text-ink-muted">
                {pIdx + 1} / {pages.length} 쪽
              </div>
            </header>

            <div className={cn('grid gap-4', layout === '2x4' ? 'grid-cols-2' : 'grid-cols-4')}>
              {tablesOnPage.map((t) => {
                const url = `${CUSTOMER_BASE}/t/${t.qrToken}`;
                const qrSize = layout === '2x4' ? 200 : 130;
                return (
                  <div
                    key={t.id}
                    className="border border-black/20 rounded-lg p-3 flex flex-col items-center text-center bg-white"
                  >
                    <div className="text-base font-bold text-black">{t.name}</div>
                    <div className="text-xs text-ink-muted mb-2">테이블 #{t.number}</div>
                    <QrCodeImg text={url} size={qrSize} />
                    <div className="text-[10px] text-ink-muted mt-2 break-all">{url}</div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
