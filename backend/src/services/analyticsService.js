import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function uid(userId) {
  return new mongoose.Types.ObjectId(userId);
}

/** Last N days including today */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return startOfDay(d);
}

export async function getDashboardAnalytics(userId) {
  const oid = uid(userId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = daysAgo(7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSalesAgg,
    todayAgg,
    weekAgg,
    monthAgg,
    pendingAgg,
    profitAgg,
    topProducts,
    categorySales,
    hourlyAgg,
    distinctCustomers,
    productMeta,
  ] = await Promise.all([
    Bill.aggregate([
      { $match: { userId: oid } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Bill.aggregate([
      {
        $match: {
          userId: oid,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { userId: oid, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: { userId: oid, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      {
        $match: {
          userId: oid,
          paymentStatus: { $in: ['pending', 'partial'] },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
    ]),
    Bill.aggregate([
      { $match: { userId: oid } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productRow',
        },
      },
      { $unwind: { path: '$productRow', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          unitCost: { $ifNull: ['$productRow.cost', 0] },
        },
      },
      {
        $addFields: {
          margin: {
            $subtract: ['$items.unitPrice', '$unitCost'],
          },
        },
      },
      {
        $group: {
          _id: null,
          profit: {
            $sum: { $multiply: ['$margin', '$items.quantity'] },
          },
        },
      },
    ]),
    Bill.aggregate([
      { $match: { userId: oid } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 8 },
    ]),
    Bill.aggregate([
      { $match: { userId: oid, createdAt: { $gte: daysAgo(30) } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productRow',
        },
      },
      { $unwind: { path: '$productRow', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productRow.category',
          revenue: { $sum: '$items.totalPrice' },
          qty: { $sum: '$items.quantity' },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
    Bill.aggregate([
      { $match: { userId: oid, createdAt: { $gte: daysAgo(30) } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
    ]),
    Bill.distinct('customerPhone', {
      userId: oid,
      customerPhone: { $nin: [null, ''] },
    }),
    Product.find({ userId: oid }).select('_id name units category price').lean(),
  ]);

  const totalSales = totalSalesAgg[0]?.total || 0;
  const todaySales = todayAgg[0]?.total || 0;
  const weeklySales = weekAgg[0]?.total || 0;
  const monthlyRevenue = monthAgg[0]?.total || 0;
  const pendingPayments = {
    count: pendingAgg[0]?.count || 0,
    amount: pendingAgg[0]?.amount || 0,
  };
  const profitAnalysis = {
    estimatedProfit: Math.round((profitAgg[0]?.profit || 0) * 100) / 100,
    marginNote:
      'Profit uses selling price minus recorded product cost. Set cost on products for accuracy.',
  };

  const salesByProductLast30 = await Bill.aggregate([
    { $match: { userId: oid, createdAt: { $gte: daysAgo(30) } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        qty: { $sum: '$items.quantity' },
      },
    },
  ]);

  const qtyMap = new Map(
    salesByProductLast30.map((r) => [r._id.toString(), r.qty])
  );

  const lowStock = productMeta.filter((p) => p.units > 0 && p.units < 10);
  const outOfStock = productMeta.filter((p) => p.units <= 0);

  const slowMoving = productMeta
    .map((p) => ({
      ...p,
      sold30d: qtyMap.get(p._id.toString()) || 0,
    }))
    .filter((p) => p.units > 5 && p.sold30d < 3)
    .sort((a, b) => a.sold30d - b.sold30d)
    .slice(0, 8);

  const fastMoving = productMeta
    .map((p) => ({
      ...p,
      sold30d: qtyMap.get(p._id.toString()) || 0,
    }))
    .filter((p) => p.sold30d >= 10)
    .sort((a, b) => b.sold30d - a.sold30d)
    .slice(0, 8);

  const peak = hourlyAgg[0];
  const peakSalesTime =
    peak != null
      ? {
          hour: peak._id,
          label: `${String(peak._id).padStart(2, '0')}:00–${String(
            (peak._id + 1) % 24
          ).padStart(2, '0')}:00`,
          revenue: peak.revenue,
        }
      : null;

  const yesterdayStart = startOfDay(new Date(now.getTime() - 86400000));
  const yesterdayEnd = endOfDay(new Date(now.getTime() - 86400000));
  const [yesterdayAgg] = await Bill.aggregate([
    {
      $match: {
        userId: oid,
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const yesterdaySales = yesterdayAgg?.total || 0;

  const revenueTrend =
    yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 1000) / 10
      : todaySales > 0
        ? 100
        : 0;

  const dailySparkline = await Bill.aggregate([
    { $match: { userId: oid, createdAt: { $gte: daysAgo(14) } } },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' },
        },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
  ]);

  return {
    totals: {
      totalSales,
      todaySales,
      weeklySales,
      monthlyRevenue,
      totalOrders: await Bill.countDocuments({ userId: oid }),
      totalProducts: productMeta.length,
      totalCustomers: distinctCustomers.length,
    },
    pendingPayments,
    profitAnalysis,
    topSellingProducts: topProducts.map((t) => ({
      productId: t._id,
      name: t.name,
      quantitySold: t.qty,
      revenue: t.revenue,
    })),
    bestSellingCategories: categorySales.map((c) => ({
      category: c._id,
      revenue: c.revenue,
      quantity: c.qty,
    })),
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    slowMovingProducts: slowMoving,
    fastMovingProducts: fastMoving,
    peakSalesTime,
    comparisons: {
      yesterdaySales,
      todayVsYesterdayPercent: revenueTrend,
    },
    charts: {
      last14DaysRevenue: dailySparkline.map((row) => ({
        date: new Date(row._id.y, row._id.m - 1, row._id.d).toISOString(),
        revenue: row.revenue,
      })),
    },
  };
}

export async function getReportDataset(userId, range) {
  const oid = uid(userId);
  let start;
  const end = endOfDay(new Date());
  const now = new Date();
  if (range === 'daily') {
    start = startOfDay(now);
  } else if (range === 'weekly') {
    start = daysAgo(7);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const bills = await Bill.find({
    userId: oid,
    createdAt: { $gte: start, $lte: end },
  })
    .sort({ createdAt: -1 })
    .lean();

  const products = await Product.find({ userId: oid }).lean();

  const analytics = await getDashboardAnalytics(userId);

  return {
    range,
    period: { start, end },
    bills,
    products,
    analyticsSnapshot: {
      totals: analytics.totals,
      pendingPayments: analytics.pendingPayments,
      profitAnalysis: analytics.profitAnalysis,
    },
  };
}
