import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

chatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model('ChatMessage', chatMessageSchema);
