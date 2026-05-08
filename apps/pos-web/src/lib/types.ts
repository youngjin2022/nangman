// POS 도메인 타입 - 추후 packages/shared-types로 통합 예정

export type TableStatus = 'AVAILABLE' | 'OCCUPIED';

export type OrderStatus =
  | 'PENDING' // 손님 요청 - 미확인
  | 'CONFIRMED' // 직원 확인
  | 'PREPARING' // 조리 중
  | 'SERVED' // 서빙 완료
  | 'COMPLETED' // 결제 완료
  | 'CANCELLED';

export type OrderItemStatus = 'ORDERED' | 'PREPARING' | 'SERVED' | 'CANCELLED';

export type OrderType = 'CUSTOMER' | 'POS';

export type PaymentMethod = 'CARD' | 'CASH' | 'KAKAO' | 'NAVER' | 'TOSS';

export type TableOverview = {
  tableId: string;
  tableNumber: string;
  tableName: string;
  status: TableStatus;
  occupiedSince: string | null; // ISO
  pendingOrderCount: number; // 미확인 신규 주문 수 (PENDING 상태)
  totalAmount: number; // 미결제 누적
  totalItemCount: number;
};

export type OrderItem = {
  id: string;
  menuId: string;
  menuName: string;
  unitPrice: number;
  quantity: number;
  options: string[]; // 표시용 (예: "보통맛", "치즈 추가")
  status: OrderItemStatus;
  memo?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  memo?: string;
  requestedAt: string; // ISO
  confirmedAt?: string;
};

export type TableDetail = {
  table: TableOverview;
  orders: Order[];
  totalAmount: number;
};

// 메뉴 (POS 직접 입력용)
export type MenuOption = {
  id: string;
  name: string;
  additionalPrice: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  items: MenuOption[];
};

export type Menu = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isSoldOut: boolean;
  imageUrl?: string | null;
  optionGroups?: MenuOptionGroup[];
};

export type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

// 실시간 이벤트 (Socket.IO 페이로드)
export type RealtimeEvent =
  | { type: 'order.created'; tableId: string; order: Order }
  | { type: 'order.updated'; tableId: string; orderId: string; status: OrderStatus }
  | { type: 'table.cleared'; tableId: string };

// 결제 페이로드
export type PaymentPayload = {
  tableId: string;
  orderIds: string[];
  method: PaymentMethod;
  amount: number;
};
