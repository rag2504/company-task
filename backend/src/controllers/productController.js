import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

function uid(req) {
  return req.user._id;
}

export async function listProducts(req) {
  return Product.find({ userId: uid(req) }).sort({ updatedAt: -1 }).lean();
}

export async function getProduct(req) {
  const p = await Product.findOne({ _id: req.params.id, userId: uid(req) });
  if (!p) throw new AppError('Product not found', 404);
  return p;
}

export async function createProduct(req) {
  const body = req.body;
  const doc = await Product.create({
    userId: uid(req),
    name: body.name,
    units: Number(body.units),
    weight: Number(body.weight),
    price: Number(body.price),
    cost: body.cost != null ? Number(body.cost) : 0,
    category: body.category,
    description: body.description || '',
    aiDescription: body.aiDescription || '',
    aiShortSummary: body.aiShortSummary || '',
    aiSeoText: body.aiSeoText || '',
    aiHighlights: body.aiHighlights || [],
  });
  return doc;
}

export async function updateProduct(req) {
  const p = await Product.findOne({ _id: req.params.id, userId: uid(req) });
  if (!p) throw new AppError('Product not found', 404);
  const body = req.body;
  const fields = [
    'name',
    'units',
    'weight',
    'price',
    'cost',
    'category',
    'description',
    'aiDescription',
    'aiShortSummary',
    'aiSeoText',
    'aiHighlights',
  ];
  for (const f of fields) {
    if (body[f] !== undefined) p[f] = body[f];
  }
  await p.save();
  return p;
}

export async function deleteProduct(req) {
  const p = await Product.findOneAndDelete({
    _id: req.params.id,
    userId: uid(req),
  });
  if (!p) throw new AppError('Product not found', 404);
  return { message: 'Product deleted successfully' };
}
