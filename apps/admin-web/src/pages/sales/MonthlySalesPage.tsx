// 월별 매출 - 일자별 추이 + 결제수단 + 베스트셀러
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { getMonthlySales } from '@/lib/api';
import type { MonthlySalesData } from '@/lib/types';
import { formatKRW, formatNumber, thisMonthISO } from '@/lib/utils';
import { useMediaQuery } from '@/lib/useMediaQuery';

const METHOD_LABEL: Record<string, string> = {
  CARD: '카드', CASH: '현금', KAKAO: '카카오', NAVER: '네이버', TOSS: '토스',
};
const METHOD_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#84CC16', '#06B6D4'];

export function MonthlySalesPage() {
  const [month, setMonth] = useState(thisMonthISO());
  const [data, setData] = useState<MonthlySalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const compactCharts = useMediaQuery('(max-width: 1023px)');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMonthlySales(month).then((d) => { if (!cancelled) { setData(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [month]);

  return (
    <div>
      <PageHeader
        title="월별 매출"
        description="월간 일자별 매출 추이"
        right={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            max={thisMonthISO()}
            className="h-11 w-full max-w-[200px] sm:max-w-none px-3 rounded-lg border border-line text-base sm:text-sm"
          />
        }
      />

      {loading || !data ? (
        <div className="text-center py-12 text-ink-muted text-sm">불러오는 중…</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="월 매출" value={formatKRW(data.totalRevenue)} highlight />
            <StatCard label="총 주문" value={`${formatNumber(data.totalOrders)}건`} />
            <StatCard
              label="일평균 매출"
              value={formatKRW(Math.round(data.totalRevenue / data.daily.length))}
            />
            <StatCard
              label="최고 매출일"
              value={topDayOf(data)}
            />
          </div>

          {/* 일자별 추이 */}
          <section className="bg-bg-panel rounded-2xl border border-line p-4 sm:p-5 overflow-hidden">
            <h3 className="text-sm font-bold mb-3 sm:mb-4">일자별 매출 추이</h3>
            <div className="-mx-2 sm:-mx-0 overflow-x-auto scrollbar-thin lg:overflow-visible">
              <div className="min-w-[560px] lg:min-w-0 h-60 sm:h-72 px-2 sm:px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EB" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.split('-')[2]}
                      fontSize={11}
                    />
                    <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} fontSize={11} />
                    <Tooltip
                      formatter={(v: number) => [formatKRW(v), '매출']}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-bg-panel rounded-2xl border border-line p-4 sm:p-5 overflow-hidden">
              <h3 className="text-sm font-bold mb-3 sm:mb-4">결제수단 분포</h3>
              <div className="h-56 sm:h-64 min-h-[14rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byMethod}
                      dataKey="revenue"
                      nameKey="method"
                      cx="50%" cy="50%" outerRadius={compactCharts ? 56 : 80}
                      label={(entry) => METHOD_LABEL[entry.method as string] ?? entry.method}
                    >
                      {data.byMethod.map((_, i) => (
                        <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatKRW(v)} />
                    <Legend formatter={(value) => METHOD_LABEL[value] ?? value} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-bg-panel rounded-2xl border border-line p-4 sm:p-5">
              <h3 className="text-sm font-bold mb-3 sm:mb-4">월간 베스트셀러 TOP 5</h3>
              <div className="space-y-3">
                {data.topMenus.map((m, idx) => (
                  <div key={m.menuName} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{m.menuName}</span>
                    <span className="text-xs text-ink-muted tabular-nums">{formatNumber(m.quantity)}개</span>
                    <span className="text-sm font-semibold tabular-nums w-28 text-right">{formatKRW(m.revenue)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function topDayOf(data: MonthlySalesData): string {
  const top = [...data.daily].sort((a, b) => b.revenue - a.revenue)[0];
  if (!top || top.revenue === 0) return '-';
  return `${top.date.split('-')[2]}일 (${formatKRW(top.revenue)})`;
}
