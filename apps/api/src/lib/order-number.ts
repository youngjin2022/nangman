// 주문번호 생성 - YYYYMMDD-NNN 형식
// 단일 매장 가정. 동일 매장·동일 일자 순차 카운트.
// 동시성 보호: COUNT 기반이라 락 없으면 충돌 가능 — 운영 단계에서 Postgres sequence로 교체 권장.

import { prisma } from './prisma';

export async function nextOrderNumber(storeId: string): Promise<string> {
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // 오늘 자정~내일 자정 범위 (KST 보정 X - 운영 시 zone 처리 필요)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.order.count({
    where: {
      storeId,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });

  return `${yyyymmdd}-${String(count + 1).padStart(3, '0')}`;
}
