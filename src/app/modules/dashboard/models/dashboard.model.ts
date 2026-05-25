export interface DashboardStats {
  totalCustomers: number;
  activeWorkOrders: number;
  todayRevenue: number;
  pendingBookings: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recentBookings: any[];
  activeWorkOrders: any[];
}
