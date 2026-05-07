'use client';

// 장바구니 1개 항목 행 - 옵션 표시, 수량 조절, 삭제
import type { CartItem } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { formatKRW } from '@/lib/utils';
import { QuantityStepper } from './QuantityStepper';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="p-4 bg-bg-card rounded-2xl border border-line">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold truncate">{item.menuName}</h3>
          {item.selectedOptions.length > 0 && (
            <p className="text-xs text-muted mt-1">
              {item.selectedOptions.map((o) => o.itemName).join(' · ')}
            </p>
          )}
        </div>
        <button
          onClick={() => removeItem(item.lineId)}
          className="p-1 -mr-1 text-muted active:opacity-60"
          aria-label="삭제"
        >
          {/* X 아이콘 */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <QuantityStepper
          value={item.quantity}
          onChange={(q) => updateQuantity(item.lineId, q)}
          size="sm"
        />
        <span className="text-base font-semibold text-accent">
          {formatKRW(item.unitPrice * item.quantity)}
        </span>
      </div>
    </div>
  );
}
