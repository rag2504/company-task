import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/aiController.js';

const r = Router();
r.use(authenticate);
r.use(aiLimiter);

r.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const data = await c.chat(req);
    res.json({ success: true, ...data });
  })
);

r.get(
  '/chat/history',
  asyncHandler(async (req, res) => {
    const data = await c.chatHistory(req);
    res.json({ success: true, messages: data });
  })
);

r.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const data = await c.insights(req);
    res.json({ success: true, ...data });
  })
);

r.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const data = await c.summary(req);
    res.json({ success: true, ...data });
  })
);

r.post(
  '/search',
  asyncHandler(async (req, res) => {
    const data = await c.smartSearch(req);
    res.json({ success: true, ...data });
  })
);

r.post(
  '/product-description',
  asyncHandler(async (req, res) => {
    const data = await c.productDescription(req);
    res.json({ success: true, ...data });
  })
);

r.patch(
  '/products/:id/apply-copy',
  asyncHandler(async (req, res) => {
    const data = await c.applyProductAi(req);
    res.json({ success: true, product: data });
  })
);

r.get(
  '/predictions/stock',
  asyncHandler(async (req, res) => {
    const data = await c.predictions(req);
    res.json({ success: true, ...data });
  })
);

export default r;
