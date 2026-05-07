'use client';

// 화면 하단 고정 장바구니 진입 버튼 - 항목이 있을 때만 표시
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { formatKRW } from '@/lib/utils';

export function CartFloatingButton() {
  // SSR Hydration 불일치 방지: 클라이언트 마운트 후에만 렌더
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalCount = useCartStore((s) => s.getTotalCount());
  const totalAmount = useCartStore((s) => s.getTotalAmount());

  if (!mounted || totalCount === 0) return null;

  return (
    <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-bg via-bg/95 to-transparent">
      <Link
        href="/cart"
        className="flex items-center justify-between w-full h-14 px-5 bg-accent text-black rounded-2xl font-semibold shadow-lg active:scale-[0.98] transition"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/20 text-sm">
            {totalCount}
          </span>
          <span>장바구니 보기</span>
        </span>
        <span>{formatKRW(totalAmount)}</span>
      </Link>
    </div>
  );
}
