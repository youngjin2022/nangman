import { type ClassValue, clsx } from 'clsx';

// Tailwind 클래스 조건부 결합 헬퍼
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 원화 포맷터 (3자리 콤마 + 원)
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

// 라인 ID 생성 (동일 메뉴 + 동일 옵션 조합 식별)
export function buildLineId(menuId: string, optionItemIds: string[]): string {
  const sorted = [...optionItemIds].sort().join('-');
  return `${menuId}__${sorted || 'none'}`;
}
