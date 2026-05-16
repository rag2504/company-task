import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'low_stock',
        'sales_insight',
        'restock',
        'high_demand',
        'slow_sales',
        'revenue_milestone',
        'inventory',
        'payment',
        'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
