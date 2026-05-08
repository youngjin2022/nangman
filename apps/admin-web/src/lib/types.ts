// 공유 타입 직접 정의
export type PaymentMethod = 'CARD' | 'CASH' | 'KAKAO' | 'NAVER' | 'TOSS';

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
  imageUrl?: string | null;
  isSoldOut: boolean;
  optionGroups?: MenuOptionGroup[];
}

export interface AdminTable {
  id: string;
  number: string;
  name: string;
  qrToken: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface DailySalesPoint {
  hour: number;
  revenue: number;
  orderCount: number;
}

export interface DailySalesData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  hourly: DailySalesPoint[];
  byMethod: Array<{ method: PaymentMethod; revenue: number; count: number }>;
  topMenus: Array<{ menuName: string; quantity: number; revenue: number }>;
}

export interface MonthlySalesPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface MonthlySalesData {
  month: string;
  totalRevenue: number;
  totalOrders: number;
  daily: MonthlySalesPoint[];
  byMethod: Array<{ method: PaymentMethod; revenue: number; count: number }>;
  topMenus: Array<{ menuName: string; quantity: number; revenue: number }>;
}