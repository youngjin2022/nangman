import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

// "HH:mm" 형식 시간 (24시간)
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// 점유 시간 경과 - "1시간 23분" 형태
export function formatElapsed(fromIso: string, toMs: number = Date.now()): string {
  const diffMin = Math.max(0, Math.floor((toMs - new Date(fromIso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}분`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

// 라인 ID (메뉴+옵션 조합 고유키)
export function buildLineId(menuId: string, optionItemIds: string[]): string {
  const sorted = [...optionItemIds].sort().join('-');
  return `${menuId}__${sorted || 'none'}`;
}
