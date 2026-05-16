import { Router } from 'express';
import { authenticate, requireOwner } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/productController.js';

const r = Router();
r.use(authenticate);

r.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await c.listProducts(req);
    res.json(data);
  })
);

r.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await c.getProduct(req);
    res.json(data);
  })
);

r.post(
  '/',
  requireOwner,
  asyncHandler(async (req, res) => {
    const data = await c.createProduct(req);
    res.status(201).json(data);
  })
);

r.put(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const data = await c.updateProduct(req);
    res.json(data);
  })
);

r.delete(
  '/:id',
  requireOwner,
  asyncHandler(async (req, res) => {
    const data = await c.deleteProduct(req);
    res.json(data);
  })
);

export default r;
