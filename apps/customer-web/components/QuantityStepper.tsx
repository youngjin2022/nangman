'use client';

// 수량 조절 (-/+) - 터치 타겟 44px 보장
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  size?: 'sm' | 'md';
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const btnSize = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const textSize = size === 'sm' ? 'text-sm w-8' : 'text-base w-10';

  return (
    <div className="inline-flex items-center bg-bg-elevated rounded-full">
      <button
        onClick={dec}
        disabled={value <= min}
        className={cn(
          btnSize,
          'flex items-center justify-center text-white active:opacity-60 disabled:opacity-30',
        )}
        aria-label="수량 감소"
      >
        −
      </button>
      <span className={cn('text-center font-medium tabular-nums', textSize)}>{value}</span>
      <button
        onClick={inc}
        disabled={value >= max}
        className={cn(
          btnSize,
          'flex items-center justify-center text-white active:opacity-60 disabled:opacity-30',
        )}
        aria-label="수량 증가"
      >
        +
      </button>
    </div>
  );
}
