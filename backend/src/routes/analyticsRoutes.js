import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/analyticsController.js';

const r = Router();
r.use(authenticate);

r.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await c.dashboardAnalytics(req);
    res.json({ success: true, data });
  })
);

r.get(
  '/legacy-stats',
  asyncHandler(async (req, res) => {
    const data = await c.legacyStats(req);
    res.json(data);
  })
);

export default r;
