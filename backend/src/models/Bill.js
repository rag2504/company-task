import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    billNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true, default: '' },
    items: { type: [billItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'partial'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'credit'],
      default: 'cash',
    },
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, createdAt: -1 });

export const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);
