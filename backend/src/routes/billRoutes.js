import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/billController.js';

const r = Router();
r.use(authenticate);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await c.listBills(req);
    res.json(data);
  })
);

r.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await c.getBill(req);
    res.json(data);
  })
);

r.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = await c.createBill(req);
    res.status(201).json(data);
  })
);

r.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await c.updateBill(req);
    res.json(data);
  })
);

r.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await c.deleteBill(req);
    res.json(data);
  })
);

export default r;
