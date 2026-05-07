// admin-web 도메인 타입 - 추후 @nangman/shared-types로 점진 통합
import type {
  Category,
  Menu,
  MenuOptionGroup,
  MenuOptionItem,
  PaymentMethod,
} from '@nangman/shared-types';

export type { Category, Menu, MenuOptionGroup, MenuOptionItem, PaymentMethod };

// 관리자 화면 전용 확장 타입

export interface AdminTable {
  id: string;
  number: string;
  name: string;
  qrToken: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

// 매출 - 일별 시간대별
export interface DailySalesPoint {
  hour: number; // 0..23
  revenue: number;
  orderCount: number;
}

export interface DailySalesData {
  date: string; // YYYY-MM-DD
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  hourly: DailySalesPoint[];
  byMethod: Array<{ method: PaymentMethod; revenue: number; count: number }>;
  topMenus: Array<{ menuName: string; quantity: number; revenue: number }>;
}

// 매출 - 월별 일자별
export interface MonthlySalesPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orderCount: number;
}

export interface MonthlySalesData {
  month: string; // YYYY-MM
  totalRevenue: number;
  totalOrders: number;
  daily: MonthlySalesPoint[];
  byMethod: Array<{ method: PaymentMethod; revenue: number; count: number }>;
  topMenus: Array<{ menuName: string; quantity: number; revenue: number }>;
}
