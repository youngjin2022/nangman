// 초기 시드 데이터 - customer-web/admin-web Mock과 동일한 구성
// 실행: pnpm --filter api prisma db seed
//
// 멱등성: 동일 ID로 upsert하므로 여러 번 실행해도 안전

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] 시작');

  // ===== 매장 =====
  const store = await prisma.store.upsert({
    where: { id: 'store-001' },
    create: {
      id: 'store-001',
      name: '낭만포차',
      businessNumber: '123-45-67890',
      phone: '02-1234-5678',
      address: '서울특별시 마포구 어딘가',
    },
    update: {},
  });
  console.log(`[seed] 매장: ${store.name}`);

  // ===== 직원 (사장님 1명) =====
  // 비밀번호 'admin1234'의 bcrypt 해시 (라운드 10) - 운영 시 변경
  const ownerPasswordHash = '$2b$10$7q6rEQ5Y0b5lYj5R5Jx5seMjqXsK3RkRr6m5O.FZGfV3p9cZ5Wj1u';
  await prisma.staff.upsert({
    where: { email: 'owner@nangman.com' },
    create: {
      id: 'staff-owner',
      storeId: store.id,
      email: 'owner@nangman.com',
      passwordHash: ownerPasswordHash,
      name: '사장님',
      role: 'OWNER',
    },
    update: {},
  });

  // ===== 카테고리 =====
  const categories = [
    { id: 'cat-soju', name: '소주', displayOrder: 1 },
    { id: 'cat-beer', name: '맥주', displayOrder: 2 },
    { id: 'cat-makgeolli', name: '막걸리', displayOrder: 3 },
    { id: 'cat-anju-main', name: '메인 안주', displayOrder: 4 },
    { id: 'cat-anju-light', name: '간단 안주', displayOrder: 5 },
  ];
  for (const c of categories) {
    await prisma.menuCategory.upsert({
      where: { id: c.id },
      create: { ...c, storeId: store.id },
      update: { name: c.name, displayOrder: c.displayOrder },
    });
  }

  // ===== 메뉴 =====
  type MenuSeed = {
    id: string; categoryId: string; name: string; price: number;
    description?: string; isSoldOut?: boolean;
    options?: Array<{
      id: string; name: string; isRequired: boolean; min: number; max: number;
      items: Array<{ id: string; name: string; addPrice: number; isDefault?: boolean }>;
    }>;
  };
  const menus: MenuSeed[] = [
    { id: 'menu-soju-1', categoryId: 'cat-soju', name: '참이슬 후레쉬', price: 5000, description: '깔끔한 목넘김' },
    { id: 'menu-soju-2', categoryId: 'cat-soju', name: '처음처럼', price: 5000 },
    { id: 'menu-soju-3', categoryId: 'cat-soju', name: '진로이즈백', price: 5000, isSoldOut: true },
    {
      id: 'menu-beer-1', categoryId: 'cat-beer', name: '카스', price: 6000,
      options: [{
        id: 'opt-beer-size', name: '용량', isRequired: true, min: 1, max: 1,
        items: [
          { id: 'opt-beer-bottle', name: '병', addPrice: 0, isDefault: true },
          { id: 'opt-beer-pitcher', name: '피처', addPrice: 12000 },
        ],
      }],
    },
    { id: 'menu-beer-2', categoryId: 'cat-beer', name: '테라', price: 6000 },
    { id: 'menu-beer-3', categoryId: 'cat-beer', name: '크러시', price: 6500 },
    { id: 'menu-mak-1', categoryId: 'cat-makgeolli', name: '지평 생막걸리', price: 7000 },
    { id: 'menu-mak-2', categoryId: 'cat-makgeolli', name: '느린마을 막걸리', price: 9000 },
    { id: 'menu-main-1', categoryId: 'cat-anju-main', name: '모듬 전', price: 22000, description: '해물파전+김치전+동그랑땡' },
    {
      id: 'menu-main-2', categoryId: 'cat-anju-main', name: '낙지볶음', price: 28000,
      options: [{
        id: 'opt-spice', name: '맵기', isRequired: true, min: 1, max: 1,
        items: [
          { id: 'opt-spice-mild', name: '순한맛', addPrice: 0, isDefault: true },
          { id: 'opt-spice-medium', name: '보통맛', addPrice: 0 },
          { id: 'opt-spice-hot', name: '매운맛', addPrice: 0 },
        ],
      }],
    },
    { id: 'menu-main-3', categoryId: 'cat-anju-main', name: '곱창전골', price: 32000 },
    { id: 'menu-light-1', categoryId: 'cat-anju-light', name: '먹태 한 마리', price: 12000 },
    { id: 'menu-light-2', categoryId: 'cat-anju-light', name: '계란말이', price: 9000 },
    { id: 'menu-light-3', categoryId: 'cat-anju-light', name: '감자튀김', price: 7000, isSoldOut: true },
  ];

  for (const m of menus) {
    await prisma.menu.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        storeId: store.id,
        categoryId: m.categoryId,
        name: m.name,
        price: m.price,
        description: m.description,
        isSoldOut: m.isSoldOut ?? false,
      },
      update: { price: m.price, name: m.name, isSoldOut: m.isSoldOut ?? false },
    });
    // 옵션 그룹 + 항목 (있는 경우만)
    for (const g of m.options ?? []) {
      await prisma.menuOptionGroup.upsert({
        where: { id: g.id },
        create: {
          id: g.id, menuId: m.id, name: g.name,
          isRequired: g.isRequired, minSelect: g.min, maxSelect: g.max,
        },
        update: { name: g.name, isRequired: g.isRequired, minSelect: g.min, maxSelect: g.max },
      });
      for (const it of g.items) {
        await prisma.menuOptionItem.upsert({
          where: { id: it.id },
          create: {
            id: it.id, optionGroupId: g.id, name: it.name,
            additionalPrice: it.addPrice, isDefault: it.isDefault ?? false,
          },
          update: { name: it.name, additionalPrice: it.addPrice },
        });
      }
    }
  }

  // ===== 테이블 =====
  const tables = [
    { id: 'tbl-001', tableNumber: '1', name: '1번 테이블', qrToken: 'tbl-001-token', capacity: 4 },
    { id: 'tbl-002', tableNumber: '2', name: '2번 테이블', qrToken: 'tbl-002-token', capacity: 4 },
    { id: 'tbl-003', tableNumber: '3', name: '3번 테이블', qrToken: 'tbl-003-token', capacity: 4 },
    { id: 'tbl-004', tableNumber: '4', name: '4번 테이블', qrToken: 'tbl-004-token', capacity: 4 },
    { id: 'tbl-005', tableNumber: '5', name: '5번 테이블', qrToken: 'tbl-005-token', capacity: 4 },
    { id: 'tbl-vip', tableNumber: 'V', name: 'VIP룸', qrToken: 'tbl-vip-token', capacity: 8 },
  ];
  for (const t of tables) {
    await prisma.restaurantTable.upsert({
      where: { id: t.id },
      create: { ...t, storeId: store.id },
      update: { name: t.name, capacity: t.capacity },
    });
  }

  console.log('[seed] 완료');
}

main()
  .catch((e) => {
    console.error('[seed] 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
