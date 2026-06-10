// 주문 완료 화면 - 주문번호, 항목, 총액, 추가 주문 버튼
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useSessionStore } from '@/lib/store/sessionStore';
import { formatKRW } from '@/lib/utils';

// 주문 완료 후 자동으로 메뉴 홈(/t/[tableToken])으로 복귀하기까지 대기 시간(초)
const AUTO_RETURN_SECONDS = 5;

interface StoredOrder {
  orderNumber: string;
  totalAmount: number;
  totalCount: number;
  items: Array<{
    menuName: string;
    quantity: number;
    unitPrice: number;
    options: string[];
  }>;
  createdAt: string;
}

export default function OrderDonePage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);

  // tableToken 유지: 세션의 qrToken으로 메뉴 홈(/t/[tableToken])으로 복귀
  const homeHref = session ? `/t/${session.qrToken}` : '/';

  // 장바구니 페이지에서 sessionStorage에 저장한 주문 데이터 복원
  useEffect(() => {
    const raw = sessionStorage.getItem(`order-${params.orderId}`);
    if (raw) setOrder(JSON.parse(raw));
  }, [params.orderId]);

  // 카운트다운 후 자동 복귀
  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace(homeHref);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router, homeHref]);

  return (
    <main className="min-h-screen pb-32">
      <Header title="주문 완료" />

      <div className="px-6 pt-8 pb-6 text-center">
        {/* 체크 아이콘 */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="#F5A623"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold">주문이 접수되었습니다</h1>
        <p className="text-sm text-muted mt-1">
          {session?.tableName ?? '테이블'}로 음식이 준비되어 나갈 예정입니다
        </p>
      </div>

      {order && (
        <>
          <div className="px-4">
            <div className="p-4 bg-bg-card rounded-2xl border border-line">
              <div className="flex justify-between text-sm">
                <span className="text-muted">주문번호</span>
                <span className="font-semibold tabular-nums">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted">테이블</span>
                <span className="font-medium">{session?.tableName ?? '-'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted">주문시각</span>
                <span className="tabular-nums">
                  {new Date(order.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <h2 className="text-sm font-semibold mb-2 px-1">주문 내역</h2>
            <div className="bg-bg-card rounded-2xl border border-line divide-y divide-line">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-4 flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {it.menuName}{' '}
                      <span className="text-muted font-normal">× {it.quantity}</span>
                    </p>
                    {it.options.length > 0 && (
                      <p className="text-xs text-muted mt-1">{it.options.join(' · ')}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {formatKRW(it.unitPrice * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 mt-4">
            <div className="p-4 bg-bg-card rounded-2xl border border-line">
              <div className="flex justify-between text-base font-semibold">
                <span>총 결제예정</span>
                <span className="text-accent">{formatKRW(order.totalAmount)}</span>
              </div>
              <p className="text-xs text-muted mt-2">
                * 결제는 직원에게 요청해 주세요
              </p>
            </div>
          </div>
        </>
      )}

      <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-3 bg-bg/95 backdrop-blur border-t border-line space-y-2">
        <p className="text-center text-xs text-muted">
          {secondsLeft}초 후 처음 화면으로 돌아갑니다
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/menu"
            className="flex items-center justify-center w-full h-14 rounded-2xl bg-accent text-black font-semibold active:opacity-80 transition"
          >
            메뉴 추가 주문하기
          </Link>
          <button
            type="button"
            onClick={() => router.replace(homeHref)}
            className="flex items-center justify-center w-full h-14 rounded-2xl bg-bg-elevated text-white font-semibold active:opacity-80 transition"
          >
            지금 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}
