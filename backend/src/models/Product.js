import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    units: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    aiDescription: { type: String, trim: true, default: '' },
    aiShortSummary: { type: String, trim: true, default: '' },
    aiSeoText: { type: String, trim: true, default: '' },
    aiHighlights: { type: [String], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', category: 'text' });

export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);
