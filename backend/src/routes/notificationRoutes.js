import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/notificationController.js';

const r = Router();
r.use(authenticate);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await c.list(req);
    res.json({ success: true, notifications: data });
  })
);

r.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const data = await c.readOne(req);
    res.json({ success: true, notification: data });
  })
);

r.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    const data = await c.readAll(req);
    res.json({ success: true, ...data });
  })
);

r.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const data = await c.sync(req);
    res.json({ success: true, ...data });
  })
);

export default r;
