// 도메인 타입 정의 - 백엔드 DTO와 1:1 대응 (추후 packages/shared-types로 이동 예정)

export type TableSession = {
  tableId: string;
  tableNumber: string;
  tableName: string;
  storeId: string;
  storeName: string;
  qrToken: string;
};

export type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

export type MenuOptionItem = {
  id: string;
  name: string;
  additionalPrice: number;
  isDefault?: boolean;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  items: MenuOptionItem[];
};

export type Menu = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  isSoldOut: boolean;
  optionGroups?: MenuOptionGroup[];
};

// 장바구니 항목 - 메뉴 + 선택 옵션 + 수량
export type CartItem = {
  // 동일 메뉴라도 옵션이 다르면 별개 항목으로 구분하기 위한 라인 ID
  lineId: string;
  menuId: string;
  menuName: string;
  unitPrice: number; // 옵션 추가금 포함된 단가
  quantity: number;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    itemId: string;
    itemName: string;
    additionalPrice: number;
  }>;
  memo?: string;
};

// 주문 제출 페이로드 (POST /orders 바디)
export type CreateOrderPayload = {
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

export type CreateOrderResponse = {
  orderId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
};
