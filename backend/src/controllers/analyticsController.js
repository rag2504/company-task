import { getDashboardAnalytics } from '../services/analyticsService.js';

export async function dashboardAnalytics(req) {
  return getDashboardAnalytics(req.user._id);
}

/** Legacy shape for older clients */
export async function legacyStats(req) {
  const d = await getDashboardAnalytics(req.user._id);
  return {
    totalProducts: d.totals.totalProducts,
    totalBills: d.totals.totalOrders,
    totalRevenue: d.totals.totalSales,
    lowStockProducts: d.lowStockProducts.length,
    todaySales: d.totals.todaySales,
    monthlyRevenue: d.totals.monthlyRevenue,
  };
}
