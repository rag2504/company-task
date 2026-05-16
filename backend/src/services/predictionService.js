import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { chatComplete, isGroqConfigured } from './groqService.js';

function uid(userId) {
  return new mongoose.Types.ObjectId(userId);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getStockPredictions(userId) {
  const oid = uid(userId);
  const since = daysAgo(30);

  const salesVelocity = await Bill.aggregate([
    { $match: { userId: oid, createdAt: { $gte: since } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.productName' },
        qty: { $sum: '$items.quantity' },
      },
    },
  ]);

  const velocityMap = new Map(
    salesVelocity.map((s) => [
      s._id.toString(),
      { name: s.name, qty: s.qty },
    ])
  );

  const products = await Product.find({ userId: oid }).lean();
  const days = 30;
  const predictions = products.map((p) => {
    const v = velocityMap.get(p._id.toString());
    const avgDaily = v ? v.qty / days : 0;
    const daysLeft =
      avgDaily > 0 ? Math.floor(p.units / avgDaily) : p.units > 0 ? 999 : 0;
    let urgency = 'ok';
    if (p.units <= 0) urgency = 'critical';
    else if (daysLeft <= 1 && avgDaily > 0) urgency = 'critical';
    else if (daysLeft <= 3 && avgDaily > 0) urgency = 'high';
    else if (p.units < 10) urgency = 'watch';

    const suggestedReorder =
      avgDaily > 0
        ? Math.max(Math.ceil(avgDaily * 14 - p.units), 0)
        : p.units < 10
          ? 20
          : 0;

    return {
      productId: p._id,
      name: p.name,
      category: p.category,
      currentStock: p.units,
      avgDailySales: Math.round(avgDaily * 100) / 100,
      estimatedDaysUntilStockout: daysLeft === 999 ? null : daysLeft,
      urgency,
      suggestedReorderQty: suggestedReorder,
      velocityLabel:
        avgDaily > 0.5 ? 'fast' : avgDaily > 0 ? 'steady' : 'slow',
    };
  });

  predictions.sort((a, b) => {
    const order = { critical: 0, high: 1, watch: 2, ok: 3 };
    return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
  });

  let narrative = '';
  if (isGroqConfigured()) {
    const summaryPayload = predictions.slice(0, 12).map((x) => ({
      name: x.name,
      stock: x.currentStock,
      avgDaily: x.avgDailySales,
      daysLeft: x.estimatedDaysUntilStockout,
      suggest: x.suggestedReorderQty,
      urgency: x.urgency,
    }));
    narrative = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are Quickbill AI inventory advisor. Given JSON metrics, respond with 4–6 short bullet insights for a retail owner. Be specific with product names and quantities. No markdown headings.',
        },
        {
          role: 'user',
          content: JSON.stringify(summaryPayload),
        },
      ],
      { maxTokens: 600 }
    );
  }

  return { predictions, narrative };
}
