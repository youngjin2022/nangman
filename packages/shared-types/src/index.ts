// 프론트(customer-web, pos-web, admin-web) ↔ 백엔드(api) 간 공통 도메인 타입
// API 응답·요청 DTO의 단일 소스 — 변경 시 모든 앱 타입체크 동시 검증

// ===== 상태 enum =====
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderItemStatus = 'ORDERED' | 'PREPARING' | 'SERVED' | 'CANCELLED';

export type OrderType = 'CUSTOMER' | 'POS';

export type PaymentMethod = 'CARD' | 'CASH' | 'KAKAO' | 'NAVER' | 'TOSS';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIAL_REFUNDED';

export type StaffRole = 'OWNER' | 'MANAGER' | 'SERVER';

export type PrinterType = 'KITCHEN' | 'HALL';

// ===== 메뉴 도메인 =====
export interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

export interface MenuOptionItem {
  id: string;
  name: string;
  additionalPrice: number;
  isDefault?: boolean;
}

export interface MenuOptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  items: MenuOptionItem[];
}

export interface Menu {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isSoldOut: boolean;
  optionGroups?: MenuOptionGroup[];
}

// ===== 테이블 =====
export interface TableSession {
  tableId: string;
  tableNumber: string;
  tableName: string;
  storeId: string;
  storeName: string;
  qrToken: string;
}

export interface TableOverview {
  tableId: string;
  tableNumber: string;
  tableName: string;
  status: TableStatus;
  occupiedSince: string | null;
  pendingOrderCount: number;
  totalAmount: number;
  totalItemCount: number;
}

// ===== 주문 =====
export interface OrderItem {
  id: string;
  menuId: string;
  menuName: string;
  unitPrice: number;
  quantity: number;
  options: string[];
  status: OrderItemStatus;
  memo?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  memo?: string;
  requestedAt: string;
  confirmedAt?: string;
}

export interface TableDetail {
  table: TableOverview;
  orders: Order[];
  totalAmount: number;
}

// ===== 손님 → 서버 주문 생성 페이로드 =====
export interface CreateOrderPayload {
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
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

// ===== 결제 =====
export interface PaymentPayload {
  tableId: string;
  orderIds: string[];
  method: PaymentMethod;
  amount: number;
}

export interface PaymentResponse {
  paymentId: string;
  approvedAt: string;
  receiptUrl?: string;
}

// ===== 실시간 이벤트 (Socket.IO) =====
export type RealtimeEvent =
  | { type: 'order.created'; tableId: string; order: Order }
  | { type: 'order.updated'; tableId: string; orderId: string; status: OrderStatus }
  | { type: 'menu.updated'; menuId: string }
  | { type: 'table.cleared'; tableId: string }
  | { type: 'payment.approved'; orderId: string; paymentId: string };

// ===== 프린터 작업 (5단계) =====
export interface PrintJob {
  id: string;
  orderId: string;
  printerType: PrinterType;
  status: 'QUEUED' | 'PRINTED' | 'FAILED';
  payload: unknown;
  attempts: number;
  printedAt?: string;
  errorMessage?: string;
}
