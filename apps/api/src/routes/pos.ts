// POS 라우트 - 테이블 현황·주문 관리·결제·퇴석
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { nextOrderNumber } from '../lib/order-number';
import {
  emitOrderCreated, emitOrderUpdated, emitPaymentApproved, emitTableCleared,
} from '../lib/socket';

const router = Router();

// 매장 ID는 임시 고정 (멀티테넌트 도입 전) - 쿼리 파라미터로 오버라이드 허용
const STORE_ID = process.env.DEFAULT_STORE_ID ?? 'store-001';
const storeOf = (req: { query: { storeId?: unknown } }) =>
  (typeof req.query.storeId === 'string' ? req.query.storeId : STORE_ID);

// 결제 안 된 주문만 합계 대상
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SERVED'] as const;

// ===== 테이블 현황 =====
router.get('/tables', async (req, res) => {
  const storeId = storeOf(req);
  const tables = await prisma.restaurantTable.findMany({
    where: { storeId, isActive: true },
    orderBy: { tableNumber: 'asc' },
  });

  // 각 테이블의 활성 주문 집계 (한 번에)
  const tableIds = tables.map((t) => t.id);
  const orders = await prisma.order.findMany({
    where: { tableId: { in: tableIds }, status: { in: [...ACTIVE_STATUSES] } },
    include: { items: true },
  });

  const overview = tables.map((t) => {
    const myOrders = orders.filter((o) => o.tableId === t.id);
    const earliest = myOrders.reduce<Date | null>(
      (acc, o) => (acc && acc < o.requestedAt ? acc : o.requestedAt),
      null,
    );
    const totalAmount = myOrders.reduce((s, o) => s + o.subtotal, 0);
    const totalItemCount = myOrders.reduce(
      (s, o) => s + o.items.reduce((ss, it) => ss + (it.status === 'CANCELLED' ? 0 : it.quantity), 0),
      0,
    );
    const pendingOrderCount = myOrders.filter((o) => o.status === 'PENDING').length;
    return {
      tableId: t.id,
      tableNumber: t.tableNumber,
      tableName: t.name,
      status: myOrders.length > 0 ? 'OCCUPIED' : t.status,
      occupiedSince: earliest ? earliest.toISOString() : null,
      pendingOrderCount,
      totalAmount,
      totalItemCount,
    };
  });

  res.json(overview);
});

// 테이블 상세 (주문 목록 포함)
router.get('/tables/:id', async (req, res) => {
  const table = await prisma.restaurantTable.findUnique({
    where: { id: req.params.id },
  });
  if (!table) return res.status(404).json({ error: 'not found' });

  const orders = await prisma.order.findMany({
    where: { tableId: table.id, status: { not: 'COMPLETED' } },
    include: { items: { include: { selectedOptions: true } } },
    orderBy: { requestedAt: 'desc' },
  });

  // POS 화면 형식에 맞춰 가공 (옵션은 이름 배열로 평탄화)
  const ordersForView = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    orderType: o.orderType === 'CUSTOMER_MOBILE' ? 'CUSTOMER' : 'POS',
    requestedAt: o.requestedAt.toISOString(),
    confirmedAt: o.confirmedAt?.toISOString(),
    subtotal: o.subtotal,
    memo: o.memo ?? undefined,
    items: o.items.map((it) => ({
      id: it.id,
      menuId: it.menuId,
      menuName: it.menuNameSnapshot,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      options: it.selectedOptions.map((s) => s.optionNameSnapshot),
      status: it.status,
      memo: it.memo ?? undefined,
    })),
  }));

  const activeOrders = orders.filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status));
  const totalAmount = activeOrders.reduce((s, o) => s + o.subtotal, 0);
  const totalItemCount = activeOrders.reduce(
    (s, o) => s + o.items.reduce((ss, it) => ss + (it.status === 'CANCELLED' ? 0 : it.quantity), 0),
    0,
  );
  const earliest = activeOrders.reduce<Date | null>(
    (acc, o) => (acc && acc < o.requestedAt ? acc : o.requestedAt),
    null,
  );

  res.json({
    table: {
      tableId: table.id,
      tableNumber: table.tableNumber,
      tableName: table.name,
      status: activeOrders.length > 0 ? 'OCCUPIED' : table.status,
      occupiedSince: earliest ? earliest.toISOString() : null,
      pendingOrderCount: activeOrders.filter((o) => o.status === 'PENDING').length,
      totalAmount,
      totalItemCount,
    },
    orders: ordersForView,
    totalAmount,
  });
});

// POS 메뉴 (손님 메뉴와 동일 - 직접 입력용)
router.get('/menu', async (req, res) => {
  const storeId = storeOf(req);
  const [categories, menus] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { storeId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.menu.findMany({
      where: { storeId, isActive: true },
      include: { optionGroups: { include: { items: true } } },
    }),
  ]);
  res.json({ categories, menus });
});

// 주문 확인 (PENDING → CONFIRMED)
router.post('/orders/:id/confirm', async (req, res) => {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  });
  emitOrderUpdated(order.storeId, order.id, order.status);
  res.json({ ok: true });
});

// 주문 취소
router.post('/orders/:id/cancel', async (req, res) => {
  const reason = (req.body?.reason as string | undefined) ?? null;
  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    });
    await tx.orderItem.updateMany({
      where: { orderId: updated.id },
      data: { status: 'CANCELLED' },
    });
    return updated;
  });
  emitOrderUpdated(order.storeId, order.id, order.status);
  res.json({ ok: true });
});

// POS 직접 추가 주문 (즉시 CONFIRMED)
router.post('/orders', async (req, res) => {
  const body = req.body as {
    tableId: string;
    items: Array<{
      menuId: string;
      menuName: string;
      unitPrice: number;
      quantity: number;
      options: string[];
    }>;
  };

  if (!body?.tableId || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const table = await tx.restaurantTable.findUnique({ where: { id: body.tableId } });
      if (!table) throw new Error('TABLE_NOT_FOUND');

      const subtotal = body.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
      const orderNumber = await nextOrderNumber(table.storeId);
      const now = new Date();

      const order = await tx.order.create({
        data: {
          storeId: table.storeId,
          tableId: table.id,
          orderNumber,
          status: 'CONFIRMED',
          orderType: 'POS',
          subtotal,
          totalAmount: subtotal,
          requestedAt: now,
          confirmedAt: now,
          items: {
            // POS 입력은 옵션 ID가 없으므로 옵션 스냅샷은 이름만 메모로 보존
            create: body.items.map((it) => ({
              menuId: it.menuId,
              menuNameSnapshot: it.menuName,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.unitPrice * it.quantity,
              memo: it.options.length > 0 ? it.options.join(' · ') : undefined,
            })),
          },
        },
        include: { items: true },
      });

      if (table.status === 'AVAILABLE') {
        await tx.restaurantTable.update({ where: { id: table.id }, data: { status: 'OCCUPIED' } });
      }
      return order;
    });

    emitOrderCreated(result.storeId, result.tableId, result);
    res.status(201).json({
      orderId: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
      totalAmount: result.totalAmount,
      createdAt: result.requestedAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    if (msg === 'TABLE_NOT_FOUND') return res.status(404).json({ error: msg });
    console.error('[pos/orders] 생성 실패:', e);
    res.status(500).json({ error: 'pos order creation failed' });
  }
});

// 결제 처리 - 다건 주문을 한 결제로 묶음
router.post('/payments', async (req, res) => {
  const body = req.body as {
    tableId: string;
    orderIds: string[];
    method: 'CARD' | 'CASH' | 'KAKAO' | 'NAVER' | 'TOSS';
    amount: number;
  };

  if (!body?.orderIds?.length || !body.method) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    // 주문별로 결제 1건씩 생성 (간단 구현 - 운영 시 분할결제 모델 정교화)
    const orders = await tx.order.findMany({ where: { id: { in: body.orderIds } } });
    if (orders.length === 0) throw new Error('NO_ORDERS');

    // 비례 분배: 각 주문 subtotal 기준으로 amount 안분
    const totalSubtotal = orders.reduce((s, o) => s + o.subtotal, 0) || 1;
    const payments = await Promise.all(
      orders.map((o) => {
        const portion = Math.round((o.subtotal / totalSubtotal) * body.amount);
        return tx.payment.create({
          data: {
            orderId: o.id,
            paymentMethod: body.method,
            amount: portion,
            status: 'PAID',
            approvedAt: now,
          },
        });
      }),
    );

    await tx.order.updateMany({
      where: { id: { in: body.orderIds } },
      data: { status: 'COMPLETED', completedAt: now },
    });

    return { firstPaymentId: payments[0]!.id, approvedAt: now, storeId: orders[0]!.storeId };
  });

  body.orderIds.forEach((oid) => emitPaymentApproved(result.storeId, oid, result.firstPaymentId));
  res.json({ paymentId: result.firstPaymentId, approvedAt: result.approvedAt.toISOString() });
});

// 테이블 퇴석 - 결제완료된 주문은 그대로 두고 테이블만 AVAILABLE 복귀
router.post('/tables/:id/clear', async (req, res) => {
  const table = await prisma.restaurantTable.update({
    where: { id: req.params.id },
    data: { status: 'AVAILABLE' },
  });
  emitTableCleared(table.storeId, table.id);
  res.json({ ok: true });
});

export default router;
