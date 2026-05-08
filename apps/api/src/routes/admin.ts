// 관리자 라우트 - 메뉴/카테고리/테이블 CRUD + 매출 집계
import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitMenuUpdated } from '../lib/socket';

const router = Router();
const STORE_ID = process.env.DEFAULT_STORE_ID ?? 'store-001';

// ===== Categories =====
router.get('/categories', async (_req, res) => {
  const categories = await prisma.menuCategory.findMany({
    where: { storeId: STORE_ID, isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  res.json(categories);
});

router.post('/categories', async (req, res) => {
  const body = req.body as { name: string; displayOrder: number };
  const created = await prisma.menuCategory.create({
    data: { name: body.name, displayOrder: body.displayOrder, storeId: STORE_ID },
  });
  res.status(201).json(created);
});

router.patch('/categories/:id', async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const data: Prisma.MenuCategoryUncheckedUpdateInput = {};
  if (typeof body.name === 'string') data.name = body.name.trim();
  if (typeof body.displayOrder === 'number' && Number.isFinite(body.displayOrder)) {
    data.displayOrder = Math.round(body.displayOrder);
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'no_updatable_fields' });
  }
  const updated = await prisma.menuCategory.update({
    where: { id: req.params.id, storeId: STORE_ID },
    data,
  });
  res.json(updated);
});

router.delete('/categories/:id', async (req, res) => {
  // 메뉴 보유 시 차단
  const used = await prisma.menu.count({ where: { categoryId: req.params.id } });
  if (used > 0) return res.status(409).json({ error: 'category has menus' });
  await prisma.menuCategory.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ===== Menus =====
router.get('/menus', async (_req, res) => {
  const menus = await prisma.menu.findMany({
    where: { storeId: STORE_ID, isActive: true },
    include: { optionGroups: { include: { items: true } } },
  });
  res.json(menus);
});

router.post('/menus', async (req, res) => {
  const body = req.body as {
    categoryId: string; name: string; description?: string;
    price: number; isSoldOut?: boolean;
    imageUrl?: string | null;
  };
  const created = await prisma.menu.create({
    data: {
      storeId: STORE_ID,
      categoryId: body.categoryId,
      name: body.name,
      description: body.description,
      price: body.price,
      isSoldOut: body.isSoldOut ?? false,
      ...(body.imageUrl !== undefined &&
        body.imageUrl !== null &&
        body.imageUrl !== '' && { imageUrl: body.imageUrl }),
    },
  });
  emitMenuUpdated(STORE_ID, created.id);
  res.status(201).json(created);
});

router.patch('/menus/:id', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = buildMenuPatchData(body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'no_updatable_fields' });
    }
    const updated = await prisma.menu.update({
      where: { id: req.params.id, storeId: STORE_ID },
      data,
      include: { optionGroups: { include: { items: true } } },
    });
    emitMenuUpdated(STORE_ID, updated.id);
    res.json(updated);
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code === 'P2025') {
      return res.status(404).json({ error: 'menu_not_found' });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[admin] PATCH /menus/:id', e);
    res.status(500).json({ error: 'menu_update_failed', message: msg });
  }
});

router.delete('/menus/:id', async (req, res) => {
  // soft delete - 과거 주문 항목과의 FK 보존
  const updated = await prisma.menu.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  emitMenuUpdated(STORE_ID, updated.id);
  res.json({ ok: true });
});

// ===== Tables =====
router.get('/tables', async (_req, res) => {
  const tables = await prisma.restaurantTable.findMany({
    where: { storeId: STORE_ID },
    orderBy: { tableNumber: 'asc' },
  });
  // admin-web AdminTable 형식
  res.json(
    tables.map((t) => ({
      id: t.id,
      number: t.tableNumber,
      name: t.name,
      qrToken: t.qrToken,
      capacity: t.capacity,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});

router.post('/tables', async (req, res) => {
  const body = req.body as { number: string; name: string; capacity: number; isActive?: boolean };
  const created = await prisma.restaurantTable.create({
    data: {
      storeId: STORE_ID,
      tableNumber: body.number,
      name: body.name,
      capacity: body.capacity,
      isActive: body.isActive ?? true,
      qrToken: `tbl-${randomBytes(6).toString('hex')}`,
    },
  });
  res.status(201).json(toAdminTable(created));
});

router.patch('/tables/:id', async (req, res) => {
  const body = req.body as Partial<{
    number: string; name: string; capacity: number; isActive: boolean; qrToken: string;
  }>;
  const updated = await prisma.restaurantTable.update({
    where: { id: req.params.id },
    data: {
      ...(body.number !== undefined && { tableNumber: body.number }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.qrToken !== undefined && { qrToken: body.qrToken }),
    },
  });
  res.json(toAdminTable(updated));
});

router.delete('/tables/:id', async (req, res) => {
  // soft delete (활성 주문 보호)
  const updated = await prisma.restaurantTable.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ ok: true, id: updated.id });
});

router.post('/tables/:id/rotate-qr', async (req, res) => {
  const updated = await prisma.restaurantTable.update({
    where: { id: req.params.id },
    data: { qrToken: `tbl-${randomBytes(6).toString('hex')}` },
  });
  res.json(toAdminTable(updated));
});

function toAdminTable(t: {
  id: string; tableNumber: string; name: string; qrToken: string;
  capacity: number; isActive: boolean; createdAt: Date;
}) {
  return {
    id: t.id, number: t.tableNumber, name: t.name, qrToken: t.qrToken,
    capacity: t.capacity, isActive: t.isActive, createdAt: t.createdAt.toISOString(),
  };
}

// ===== 매출 집계 =====
const PAYMENT_METHODS = ['CARD', 'CASH', 'KAKAO', 'NAVER', 'TOSS'] as const;

// GET /admin/sales/daily?date=YYYY-MM-DD
router.get('/sales/daily', async (req, res) => {
  const date = String(req.query.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'invalid date' });

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      storeId: STORE_ID, status: 'COMPLETED',
      completedAt: { gte: start, lt: end },
    },
    include: {
      items: true,
      payments: { where: { status: 'PAID' } },
    },
  });

  // 시간대별
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, orderCount: 0 }));
  let totalRevenue = 0;
  for (const o of orders) {
    const h = (o.completedAt ?? o.requestedAt).getHours();
    hourly[h]!.revenue += o.totalAmount;
    hourly[h]!.orderCount += 1;
    totalRevenue += o.totalAmount;
  }

  // 결제수단별
  const methodAgg = new Map<string, { revenue: number; count: number }>();
  PAYMENT_METHODS.forEach((m) => methodAgg.set(m, { revenue: 0, count: 0 }));
  for (const o of orders) {
    for (const p of o.payments) {
      const cur = methodAgg.get(p.paymentMethod)!;
      cur.revenue += p.amount;
      cur.count += 1;
    }
  }

  // 베스트셀러
  const menuAgg = new Map<string, { quantity: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      if (it.status === 'CANCELLED') continue;
      const cur = menuAgg.get(it.menuNameSnapshot) ?? { quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.subtotal;
      menuAgg.set(it.menuNameSnapshot, cur);
    }
  }
  const topMenus = [...menuAgg.entries()]
    .map(([menuName, v]) => ({ menuName, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalOrders = orders.length;
  res.json({
    date,
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    hourly,
    byMethod: PAYMENT_METHODS.map((method) => ({
      method, ...methodAgg.get(method)!,
    })),
    topMenus,
  });
});

// GET /admin/sales/monthly?month=YYYY-MM
router.get('/sales/monthly', async (req, res) => {
  const month = String(req.query.month ?? '');
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'invalid month' });

  const [y, m] = month.split('-').map(Number);
  const start = new Date(y!, m! - 1, 1);
  const end = new Date(y!, m!, 1);
  const daysInMonth = new Date(y!, m!, 0).getDate();

  const orders = await prisma.order.findMany({
    where: {
      storeId: STORE_ID, status: 'COMPLETED',
      completedAt: { gte: start, lt: end },
    },
    include: { items: true, payments: { where: { status: 'PAID' } } },
  });

  // 일자별
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${month}-${String(i + 1).padStart(2, '0')}`,
    revenue: 0,
    orderCount: 0,
  }));
  let totalRevenue = 0;
  for (const o of orders) {
    const d = (o.completedAt ?? o.requestedAt).getDate();
    daily[d - 1]!.revenue += o.totalAmount;
    daily[d - 1]!.orderCount += 1;
    totalRevenue += o.totalAmount;
  }

  const methodAgg = new Map<string, { revenue: number; count: number }>();
  PAYMENT_METHODS.forEach((mm) => methodAgg.set(mm, { revenue: 0, count: 0 }));
  for (const o of orders) {
    for (const p of o.payments) {
      const cur = methodAgg.get(p.paymentMethod)!;
      cur.revenue += p.amount;
      cur.count += 1;
    }
  }

  const menuAgg = new Map<string, { quantity: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      if (it.status === 'CANCELLED') continue;
      const cur = menuAgg.get(it.menuNameSnapshot) ?? { quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.subtotal;
      menuAgg.set(it.menuNameSnapshot, cur);
    }
  }
  const topMenus = [...menuAgg.entries()]
    .map(([menuName, v]) => ({ menuName, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    month,
    totalRevenue,
    totalOrders: orders.length,
    daily,
    byMethod: PAYMENT_METHODS.map((method) => ({ method, ...methodAgg.get(method)! })),
    topMenus,
  });
});

function buildMenuPatchData(body: Record<string, unknown>): Prisma.MenuUncheckedUpdateInput {
  const data: Prisma.MenuUncheckedUpdateInput = {};
  if (typeof body.categoryId === 'string' && body.categoryId.trim()) {
    data.categoryId = body.categoryId.trim();
  }
  if (typeof body.name === 'string') {
    data.name = body.name.trim();
  }
  if ('description' in body) {
    if (body.description === null || body.description === '') {
      data.description = null;
    } else if (typeof body.description === 'string') {
      const d = body.description.trim();
      data.description = d.length ? d : null;
    }
  }
  if (body.price !== undefined && body.price !== null && `${body.price}` !== '') {
    const p = typeof body.price === 'number' ? body.price : Number(body.price);
    if (!Number.isNaN(p) && p >= 0) data.price = Math.round(p);
  }
  if (typeof body.isSoldOut === 'boolean') {
    data.isSoldOut = body.isSoldOut;
  }
  if ('imageUrl' in body) {
    if (body.imageUrl === null || body.imageUrl === '') {
      data.imageUrl = null;
    } else if (typeof body.imageUrl === 'string') {
      const u = body.imageUrl.trim();
      data.imageUrl = u.length ? u : null;
    }
  }
  if (typeof body.displayOrder === 'number' && Number.isFinite(body.displayOrder)) {
    data.displayOrder = Math.round(body.displayOrder);
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive;
  }
  return data;
}

export default router;
