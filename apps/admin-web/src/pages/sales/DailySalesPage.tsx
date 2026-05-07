// 일별 매출 - 시간대별 차트, 결제수단·베스트셀러 분포
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { getDailySales } from '@/lib/api';
import type { DailySalesData } from '@/lib/types';
import { formatKRW, formatNumber, todayISO } from '@/lib/utils';

const METHOD_LABEL: Record<string, string> = {
  CARD: '카드', CASH: '현금', KAKAO: '카카오', NAVER: '네이버', TOSS: '토스',
};

// 결제수단 색상 (Tailwind 동등)
const METHOD_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#84CC16', '#06B6D4'];

export function DailySalesPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<DailySalesData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDailySales(date).then((d) => { if (!cancelled) { setData(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [date]);

  return (
    <div>
      <PageHeader
        title="일별 매출"
        description="시간대별 매출, 결제수단 분포, 베스트셀러"
        right={
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO()}
            className="h-10 px-3 rounded-lg border border-line text-sm"
          />
        }
      />

      {loading || !data ? (
        <div className="text-center py-12 text-ink-muted text-sm">불러오는 중…</div>
      ) : (
        <div className="space-y-4">
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="총 매출" value={formatKRW(data.totalRevenue)} highlight />
            <StatCard label="주문 건수" value={`${formatNumber(data.totalOrders)}건`} />
            <StatCard label="평균 객단가" value={formatKRW(data.averageOrderValue)} />
            <StatCard label="피크 시간" value={peakHourOf(data)} />
          </div>

          {/* 시간대별 매출 */}
          <section className="bg-bg-panel rounded-2xl border border-line p-5">
            <h3 className="text-sm font-bold mb-4">시간대별 매출</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EB" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} fontSize={11} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                  <Tooltip
                    formatter={(v: number) => [formatKRW(v), '매출']}
                    labelFormatter={(h) => `${h}시 ~ ${(h as number) + 1}시`}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 결제수단 분포 */}
            <section className="bg-bg-panel rounded-2xl border border-line p-5">
              <h3 className="text-sm font-bold mb-4">결제수단 분포</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byMethod}
                      dataKey="revenue"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
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

            {/* 베스트셀러 */}
            <section className="bg-bg-panel rounded-2xl border border-line p-5">
              <h3 className="text-sm font-bold mb-4">베스트셀러 TOP 5</h3>
              <div className="space-y-3">
                {data.topMenus.map((m, idx) => (
                  <div key={m.menuName} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{m.menuName}</span>
                    <span className="text-xs text-ink-muted tabular-nums">{m.quantity}개</span>
                    <span className="text-sm font-semibold tabular-nums w-24 text-right">{formatKRW(m.revenue)}</span>
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

function peakHourOf(data: DailySalesData): string {
  const peak = [...data.hourly].sort((a, b) => b.revenue - a.revenue)[0];
  return peak && peak.revenue > 0 ? `${peak.hour}시 ~ ${peak.hour + 1}시` : '-';
}
