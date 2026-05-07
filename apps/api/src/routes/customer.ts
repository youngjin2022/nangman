// 손님용 라우트 - 메뉴/테이블 조회 + 주문 생성
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { nextOrderNumber } from '../lib/order-number';
import { emitOrderCreated } from '../lib/socket';

const router = Router();

// QR 토큰 → 테이블 정보
router.get('/tables/by-token/:token', async (req, res) => {
  const table = await prisma.restaurantTable.findUnique({
    where: { qrToken: req.params.token },
    include: { store: { select: { id: true, name: true } } },
  });
  if (!table || !table.isActive) return res.status(404).json({ error: 'not found' });

  res.json({
    tableId: table.id,
    tableNumber: table.tableNumber,
    tableName: table.name,
    storeId: table.storeId,
    storeName: table.store.name,
    qrToken: table.qrToken,
  });
});

// 매장 메뉴 (카테고리 + 옵션 포함)
router.get('/stores/:storeId/menu', async (req, res) => {
  const { storeId } = req.params;
  const [categories, menus] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { storeId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.menu.findMany({
      where: { storeId, isActive: true },
      include: {
        optionGroups: {
          orderBy: { displayOrder: 'asc' },
          include: { items: { orderBy: { displayOrder: 'asc' } } },
        },
      },
      orderBy: [{ categoryId: 'asc' }, { displayOrder: 'asc' }],
    }),
  ]);
  res.json({ categories, menus });
});

// 손님 주문 생성 - 메뉴·옵션 스냅샷 + 트랜잭션
router.post('/orders', async (req, res) => {
  const body = req.body as {
    tableId: string;
    storeId: string;
    items: Array<{
      menuId: string;
      quantity: number;
      optionItemIds: string[];
      memo?: string;
    }>;
    guestCount?: number;
    memo?: string;
  };

  if (!body?.tableId || !body?.storeId || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'invalid payload' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) 테이블 검증
      const table = await tx.restaurantTable.findFirst({
        where: { id: body.tableId, storeId: body.storeId, isActive: true },
      });
      if (!table) throw new Error('TABLE_NOT_FOUND');

      // 2) 메뉴 + 옵션 일괄 조회 (스냅샷용)
      const menuIds = [...new Set(body.items.map((i) => i.menuId))];
      const menus = await tx.menu.findMany({
        where: { id: { in: menuIds }, storeId: body.storeId, isActive: true },
        include: { optionGroups: { include: { items: true } } },
      });
      const menuMap = new Map(menus.map((m) => [m.id, m]));

      // 3) 라인별 단가·옵션 스냅샷 계산
      const itemsCreate: Array<{
        menuId: string;
        menuNameSnapshot: string;
        unitPrice: number;
        quantity: number;
        subtotal: number;
        memo?: string;
        selectedOptions: Array<{
          optionItemId: string;
          optionNameSnapshot: string;
          additionalPriceSnapshot: number;
        }>;
      }> = [];
      let subtotal = 0;

      for (const it of body.items) {
        const menu = menuMap.get(it.menuId);
        if (!menu) throw new Error(`MENU_NOT_FOUND:${it.menuId}`);
        if (menu.isSoldOut) throw new Error(`SOLD_OUT:${menu.name}`);

        // 옵션 검증 + 추가금 합산
        const optionItems: typeof itemsCreate[number]['selectedOptions'] = [];
        let optionAdd = 0;
        for (const optId of it.optionItemIds ?? []) {
          let found: { id: string; name: string; additionalPrice: number } | null = null;
          for (const g of menu.optionGroups) {
            const f = g.items.find((x) => x.id === optId);
            if (f) { found = f; break; }
          }
          if (!found) throw new Error(`OPTION_NOT_FOUND:${optId}`);
          optionAdd += found.additionalPrice;
          optionItems.push({
            optionItemId: found.id,
            optionNameSnapshot: found.name,
            additionalPriceSnapshot: found.additionalPrice,
          });
        }

        const unitPrice = menu.price + optionAdd;
        const lineSubtotal = unitPrice * it.quantity;
        subtotal += lineSubtotal;
        itemsCreate.push({
          menuId: menu.id,
          menuNameSnapshot: menu.name,
          unitPrice,
          quantity: it.quantity,
          subtotal: lineSubtotal,
          memo: it.memo,
          selectedOptions: optionItems,
        });
      }

      // 4) 주문번호 생성
      const orderNumber = await nextOrderNumber(body.storeId);

      // 5) Order + items + options 일괄 생성 (nested write)
      const created = await tx.order.create({
        data: {
          storeId: body.storeId,
          tableId: body.tableId,
          orderNumber,
          status: 'PENDING',
          orderType: 'CUSTOMER_MOBILE',
          subtotal,
          totalAmount: subtotal,
          guestCount: body.guestCount,
          memo: body.memo,
          requestedAt: new Date(),
          items: {
            create: itemsCreate.map((it) => ({
              menuId: it.menuId,
              menuNameSnapshot: it.menuNameSnapshot,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.subtotal,
              memo: it.memo,
              selectedOptions: { create: it.selectedOptions },
            })),
          },
        },
        include: {
          items: { include: { selectedOptions: true } },
        },
      });

      // 6) 테이블 점유 처리
      if (table.status === 'AVAILABLE') {
        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'OCCUPIED' },
        });
      }

      return created;
    });

    // 트랜잭션 성공 후 Socket.IO 브로드캐스트 (POS·관리자에 신규 주문 알림)
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
    if (msg.startsWith('MENU_NOT_FOUND') || msg.startsWith('OPTION_NOT_FOUND'))
      return res.status(400).json({ error: msg });
    if (msg.startsWith('SOLD_OUT')) return res.status(409).json({ error: msg });
    console.error('[orders] 생성 실패:', e);
    res.status(500).json({ error: 'order creation failed' });
  }
});

export default router;
