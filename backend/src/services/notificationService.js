import { Notification } from '../models/Notification.js';
import { getDashboardAnalytics } from './analyticsService.js';
import { getStockPredictions } from './predictionService.js';
import { chatComplete, isGroqConfigured } from './groqService.js';

export async function listNotifications(userId, { unreadOnly = false } = {}) {
  const q = { userId };
  if (unreadOnly) q.read = false;
  return Notification.find(q).sort({ createdAt: -1 }).limit(100).lean();
}

export async function markRead(userId, id) {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true }
  );
}

export async function markAllRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { ok: true };
}

export async function syncAiNotifications(userId, io) {
  const analytics = await getDashboardAnalytics(userId);
  const { predictions } = await getStockPredictions(userId);

  const critical = predictions.filter((p) => p.urgency === 'critical').slice(0, 5);

  const created = [];

  for (const p of critical) {
    if (p.currentStock <= 0) {
      const n = await Notification.create({
        userId,
        type: 'low_stock',
        title: `${p.name} is out of stock`,
        message: `Reorder soon. Suggested quantity: ${p.suggestedReorderQty || 'review manually'}.`,
        meta: { productId: p.productId },
      });
      created.push(n);
    } else if (p.estimatedDaysUntilStockout != null && p.estimatedDaysUntilStockout <= 3) {
      const n = await Notification.create({
        userId,
        type: 'restock',
        title: `${p.name} may run out soon`,
        message: `Based on recent velocity, stock may last ~${p.estimatedDaysUntilStockout} day(s). Consider restocking ~${p.suggestedReorderQty} units.`,
        meta: { productId: p.productId },
      });
      created.push(n);
    }
  }

  if (analytics.pendingPayments.count > 0) {
    const n = await Notification.create({
      userId,
      type: 'payment',
      title: 'Pending payments',
      message: `You have ${analytics.pendingPayments.count} unpaid or partial bills totaling approximately ₹${Math.round(analytics.pendingPayments.amount)}.`,
      meta: {},
    });
    created.push(n);
  }

  if (isGroqConfigured() && analytics.fastMovingProducts?.length) {
    const top = analytics.fastMovingProducts[0];
    const msg = await chatComplete(
      [
        {
          role: 'system',
          content:
            'Write one concise notification sentence (max 180 chars) for a POS owner about a fast-moving SKU.',
        },
        {
          role: 'user',
          content: `Product: ${top.name}, sold approx ${top.sold30d} units in 30 days.`,
        },
      ],
      { maxTokens: 120 }
    );
    const n = await Notification.create({
      userId,
      type: 'high_demand',
      title: 'High demand detected',
      message: msg.slice(0, 280),
      meta: { productId: top._id },
    });
    created.push(n);
  }

  if (io && created.length) {
    io.to(`user:${userId}`).emit('notifications:new', {
      count: created.length,
    });
  }

  return created;
}
