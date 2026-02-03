import { Order } from './order.model';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  topProducts: TopProduct[];
  recentOrders: Order[];
}

export interface TopProduct {
  productName: string;
  totalSold: number;
  revenue: number;
}
