import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { authenticate } from './middleware/auth.js';
import * as analyticsCtrl from './controllers/analyticsController.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import billRoutes from './routes/billRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(globalLimiter);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'quickbill-api', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Quickbill — AI Point of Sale API',
    status: 'ok',
    version: '2.0.0',
    docs: {
      auth: '/api/auth',
      products: '/api/products',
      bills: '/api/bills',
      analytics: '/api/analytics/dashboard',
      ai: '/api/ai/chat',
    },
  });
});

/** Backwards-compatible dashboard stats */
app.get(
  '/api/dashboard/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await analyticsCtrl.legacyStats(req);
    res.json(data);
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/orders', billRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use(errorHandler);

export default app;
