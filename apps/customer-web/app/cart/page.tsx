// 장바구니 화면 - 항목 리스트, 수량 변경, 요청사항, 주문 제출
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useSessionStore } from '@/lib/store/sessionStore';
import { createOrder } from '@/lib/api';
import { Header } from '@/components/Header';
import { CartItemRow } from '@/components/CartItemRow';
import { cn, formatKRW } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const items = useCartStore((s) => s.items);
  const memo = useCartStore((s) => s.memo);
  const setMemo = useCartStore((s) => s.setMemo);
  const totalAmount = useCartStore((s) => s.getTotalAmount());
  const totalCount = useCartStore((s) => s.getTotalCount());
  const clear = useCartStore((s) => s.clear);

  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 세션 검증
  useEffect(() => {
    if (!session) router.replace('/');
  }, [session, router]);

  const handleSubmit = async () => {
    if (!session || items.length === 0) return;
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);
    try {
      const res = await createOrder({
        tableId: session.tableId,
        storeId: session.storeId,
        items: items.map((it) => ({
          menuId: it.menuId,
          quantity: it.quantity,
          optionItemIds: it.selectedOptions.map((o) => o.itemId),
          memo: it.memo,
        })),
        memo: memo || undefined,
      });
      // 주문 성공 - 장바구니 비우고 완료 화면으로
      // 완료 화면에 표시할 데이터를 세션에 임시 저장
      sessionStorage.setItem(
        `order-${res.orderId}`,
        JSON.stringify({
          orderNumber: res.orderNumber,
          totalAmount,
          totalCount,
          items: items.map((it) => ({
            menuName: it.menuName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            options: it.selectedOptions.map((o) => o.itemName),
          })),
          createdAt: res.createdAt,
        }),
      );
      clear();
      router.replace(`/order/${res.orderId}`);
    } catch (e) {
      setError('주문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-40">
      <Header title="장바구니" showBack />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-base font-medium">장바구니가 비어있습니다</p>
          <p className="text-sm text-muted mt-1">메뉴를 담아 주세요</p>
          <Link
            href="/menu"
            className="mt-6 px-6 py-3 bg-accent text-black rounded-xl font-semibold active:opacity-80"
          >
            메뉴 보기
          </Link>
        </div>
      ) : (
        <>
          <div className="px-4 py-4 space-y-2">
            {items.map((it) => (
              <CartItemRow key={it.lineId} item={it} />
            ))}
          </div>

          {/* 요청사항 */}
          <div className="px-4 mt-2">
            <h3 className="text-sm font-semibold mb-2">요청사항 (선택)</h3>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예) 덜 맵게, 얼음 따로 부탁드려요"
              maxLength={200}
              className="w-full p-3 bg-bg-card border border-line rounded-xl text-sm placeholder:text-muted focus:outline-none focus:border-accent resize-none"
              rows={3}
            />
          </div>

          {/* 합계 */}
          <div className="px-4 mt-4">
            <div className="p-4 bg-bg-card rounded-2xl border border-line">
              <div className="flex justify-between text-sm text-muted">
                <span>총 수량</span>
                <span>{totalCount}개</span>
              </div>
              <div className="flex justify-between text-base font-semibold mt-2">
                <span>결제예정 금액</span>
                <span className="text-accent">{formatKRW(totalAmount)}</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="px-4 mt-3 text-sm text-red-400 text-center">{error}</p>
          )}

          {/* 하단 고정 주문 버튼 */}
          <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-3 bg-bg/95 backdrop-blur border-t border-line">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className={cn(
                'w-full h-14 rounded-2xl font-semibold text-base bg-accent text-black',
                'active:scale-[0.98] transition disabled:opacity-60',
              )}
            >
              {submitting ? '제출 중…' : `${formatKRW(totalAmount)} 주문하기`}
            </button>
          </div>
        </>
      )}

      {/* 주문 확인 다이얼로그 */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-bg-card rounded-2xl border border-line p-5">
            <h3 className="text-lg font-bold">주문을 제출할까요?</h3>
            <p className="text-sm text-muted mt-2">
              {session?.tableName} · {totalCount}개 · {formatKRW(totalAmount)}
            </p>
            <p className="text-xs text-muted mt-3">
              제출 후에는 직원에게 직접 변경을 요청해 주세요.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-xl bg-bg-elevated text-white font-medium active:opacity-70"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="h-12 rounded-xl bg-accent text-black font-semibold active:opacity-80"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
