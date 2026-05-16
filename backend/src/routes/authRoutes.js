import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimit.js';

const r = Router();

r.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body || {};
    const out = await auth.register({ email, password, name });
    res.status(201).json({ success: true, ...out });
  })
);

r.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const out = await auth.login({ email, password });
    res.json({ success: true, ...out });
  })
);

export default r;
