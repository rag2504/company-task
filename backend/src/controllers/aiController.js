import {
  runAssistantQuery,
  getChatHistory,
  runSmartSearch,
  generateProductCopy,
  generateBusinessInsights,
  generateExecutiveSummary,
} from '../services/aiQueryService.js';
import { getStockPredictions } from '../services/predictionService.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

export async function chat(req) {
  const text = (req.body?.message || '').trim();
  if (!text) throw new AppError('Message is required', 400);
  const reply = await runAssistantQuery(req.user._id, text);
  return { reply };
}

export async function chatHistory(req) {
  const rows = await getChatHistory(req.user._id, 50);
  return rows.map((r) => ({
    id: r._id.toString(),
    role: r.role,
    content: r.content,
    createdAt: r.createdAt,
  }));
}

export async function insights(req) {
  const period = req.query.period || 'daily';
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    throw new AppError('Invalid period', 400);
  }
  const bullets = await generateBusinessInsights(req.user._id, period);
  return { period, bullets };
}

export async function summary(req) {
  const period = req.query.period || 'daily';
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    throw new AppError('Invalid period', 400);
  }
  const summaryText = await generateExecutiveSummary(req.user._id, period);
  return { period, summary: summaryText };
}

export async function smartSearch(req) {
  const q = (req.body?.query || '').trim();
  if (!q) throw new AppError('Query is required', 400);
  return runSmartSearch(req.user._id, q);
}

export async function productDescription(req) {
  const body = req.body || {};
  const stub = {
    name: body.name,
    category: body.category,
    price: body.price,
    weight: body.weight,
    existingDescription: body.description,
  };
  if (!stub.name) throw new AppError('Product name is required', 400);
  const generated = await generateProductCopy(stub);
  if (!generated) throw new AppError('AI failed to generate description', 502);
  return generated;
}

export async function applyProductAi(req) {
  const p = await Product.findOne({ _id: req.params.id, userId: req.user._id });
  if (!p) throw new AppError('Product not found', 404);
  const body = req.body || {};
  if (body.aiDescription) p.aiDescription = body.aiDescription;
  if (body.aiShortSummary) p.aiShortSummary = body.aiShortSummary;
  if (body.aiSeoText) p.aiSeoText = body.aiSeoText;
  if (body.aiHighlights) p.aiHighlights = body.aiHighlights;
  if (body.mergeIntoDescription) {
    p.description = [p.description, body.aiDescription].filter(Boolean).join('\n\n');
  }
  await p.save();
  return p;
}

export async function predictions(req) {
  return getStockPredictions(req.user._id);
}
