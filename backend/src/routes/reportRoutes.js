import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/reportController.js';

const r = Router();
r.use(authenticate);

r.get(
  '/csv/:range',
  asyncHandler(async (req, res) => {
    await c.csv(req, res);
  })
);

r.get(
  '/excel/:range',
  asyncHandler(async (req, res) => {
    await c.excel(req, res);
  })
);

r.get(
  '/pdf/:range',
  asyncHandler(async (req, res) => {
    await c.pdf(req, res);
  })
);

export default r;
