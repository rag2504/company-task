import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
}
