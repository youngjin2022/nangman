import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

// 콤마 포맷 (단위 없음)
export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

// "2026-05-06" 형식
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "2026-05" 형식
export function thisMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// 무작위 nanoid 풍 토큰 (Mock 용)
export function genToken(prefix = 'tbl'): string {
  const r = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${r}`;
}

/** 메뉴 사진 URL — 비우면 undefined, http(s)만 허용 */
export function parseMenuImageUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}
