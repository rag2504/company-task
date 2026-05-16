import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Bill } from '../models/Bill.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { chatComplete } from './groqService.js';
import { getDashboardAnalytics } from './analyticsService.js';

function oid(id) {
  return new mongoose.Types.ObjectId(id);
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function handleIntent(userId, intent, payload) {
  const uid = oid(userId);
  const now = new Date();

  switch (intent) {
    case 'stock_lookup': {
      const kw = payload.productKeyword || '';
      const products = await Product.find({
        userId: uid,
        name: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      })
        .limit(12)
        .lean();
      if (!products.length) return `No products matched "${kw}".`;
      return products
        .map((p) => `${p.name}: ${p.units} units (${p.category})`)
        .join('\n');
    }
    case 'low_stock': {
      const list = await Product.find({
        userId: uid,
        units: { $lte: 10 },
      })
        .sort({ units: 1 })
        .limit(15)
        .lean();
      if (!list.length) return 'No low-stock items (threshold ≤10).';
      return list.map((p) => `${p.name}: ${p.units} left`).join('\n');
    }
    case 'pending_payments': {
      const bills = await Bill.find({
        userId: uid,
        paymentStatus: { $in: ['pending', 'partial'] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      if (!bills.length) return 'No pending or partial payments.';
      return bills
        .map(
          (b) =>
            `${b.billNumber} — ${b.customerName} — ₹${b.totalAmount} (${b.paymentStatus})`
        )
        .join('\n');
    }
    case 'sales_today': {
      const start = startOfDay(now);
      const end = endOfDay(now);
      const agg = await Bill.aggregate([
        {
          $match: { userId: uid, createdAt: { $gte: start, $lte: end } },
        },
        {
          $group: { _id: null, total: { $sum: '$totalAmount' }, n: { $sum: 1 } },
        },
      ]);
      const total = agg[0]?.total || 0;
      const n = agg[0]?.n || 0;
      return `Today's sales: ₹${Math.round(total * 100) / 100} across ${n} bills.`;
    }
    case 'revenue_month':
    case 'sales_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const agg = await Bill.aggregate([
        { $match: { userId: uid, createdAt: { $gte: start } } },
        {
          $group: { _id: null, total: { $sum: '$totalAmount' }, n: { $sum: 1 } },
        },
      ]);
      const total = agg[0]?.total || 0;
      const n = agg[0]?.n || 0;
      return `Month-to-date revenue: ₹${Math.round(total * 100) / 100} from ${n} bills.`;
    }
    case 'top_products_today': {
      const start = startOfDay(now);
      const end = endOfDay(now);
      const rows = await Bill.aggregate([
        {
          $match: { userId: uid, createdAt: { $gte: start, $lte: end } },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productName',
            qty: { $sum: '$items.quantity' },
          },
        },
        { $sort: { qty: -1 } },
        { $limit: 8 },
      ]);
      if (!rows.length) return 'No sales recorded today yet.';
      return rows.map((r, i) => `${i + 1}. ${r._id} — ${r.qty} units`).join('\n');
    }
    case 'customers_pending':
      return handleIntent(userId, 'pending_payments', payload);
    default:
      return null;
  }
}

export async function saveChatTurn(userId, role, content) {
  await ChatMessage.create({ userId, role, content });
}

export async function getChatHistory(userId, limit = 40) {
  const rows = await ChatMessage.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return rows.reverse();
}

export async function runAssistantQuery(userId, userText) {
  await saveChatTurn(userId, 'user', userText);

  const classifyPrompt = await chatComplete(
    [
      {
        role: 'system',
        content: `You classify cashier/owner questions for Quickbill POS. Reply ONLY JSON:
{"intent":"stock_lookup"|"low_stock"|"pending_payments"|"sales_today"|"sales_month"|"top_products_today"|"generic","productKeyword":string|null}
-intent stock_lookup: how many units left, stock questions naming a product
-intent low_stock: products running low
-intent pending_payments: unpaid bills / pending payments
-intent sales_today: today totals
-intent sales_month: monthly revenue
-intent top_products_today: bestsellers today
-intent generic: anything else`,
      },
      { role: 'user', content: userText },
    ],
    { jsonMode: true, temperature: 0.1 }
  );

  const parsed = safeParseJson(classifyPrompt) || {};
  const intent = parsed.intent || 'generic';
  let factual = await handleIntent(userId, intent, parsed);

  if (!factual) {
    const dash = await getDashboardAnalytics(userId);
    const compact = JSON.stringify({
      totals: dash.totals,
      pending: dash.pendingPayments,
      top: dash.topSellingProducts.slice(0, 5),
      low: dash.lowStockProducts.slice(0, 5),
    });
    factual = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You are Quickbill AI assistant. Answer using ONLY the JSON facts provided. If data missing, say so. Short paragraphs, friendly tone.',
        },
        {
          role: 'user',
          content: `Question: ${userText}\nFacts:\n${compact}`,
        },
      ],
      { maxTokens: 700 }
    );
  } else {
    factual = await chatComplete(
      [
        {
          role: 'system',
          content:
            'Rewrite factual POS data for the shop owner. Keep numbers exact. 2–5 sentences.',
        },
        {
          role: 'user',
          content: `Question: ${userText}\nData:\n${factual}`,
        },
      ],
      { maxTokens: 400 }
    );
  }

  await saveChatTurn(userId, 'assistant', factual);
  return factual;
}

function sanitizeProductFilters(f) {
  if (!f || typeof f !== 'object') return {};
  const o = {};
  if (typeof f.category === 'string') o.category = f.category;
  if (typeof f.nameContains === 'string') o.nameContains = f.nameContains;
  if (Number.isFinite(f.minStock)) o.minStock = f.minStock;
  if (Number.isFinite(f.maxStock)) o.maxStock = f.maxStock;
  return o;
}

function sanitizeBillFilters(f) {
  if (!f || typeof f !== 'object') return {};
  const o = {};
  if (['paid', 'pending', 'partial'].includes(f.paymentStatus)) {
    o.paymentStatus = f.paymentStatus;
  }
  if (typeof f.fromDate === 'string') o.fromDate = new Date(f.fromDate);
  if (typeof f.toDate === 'string') o.toDate = new Date(f.toDate);
  return o;
}

export async function runSmartSearch(userId, query) {
  const raw = await chatComplete(
    [
      {
        role: 'system',
        content: `Convert shop owner search into JSON ONLY:
{
 "searchProducts": boolean,
 "searchBills": boolean,
 "productFilters": { "category"?: string, "nameContains"?: string, "minStock"?: number, "maxStock"?: number },
 "billFilters": { "paymentStatus"?: "paid"|"pending"|"partial", "fromDate"?: ISO string, "toDate"?: ISO string }
}
If ambiguous, broaden search (set booleans true).`,
      },
      { role: 'user', content: query },
    ],
    { jsonMode: true, temperature: 0.05 }
  );

  const plan = safeParseJson(raw) || {};
  const uid = oid(userId);
  const results = { products: [], bills: [] };

  if (plan.searchProducts !== false) {
    const pf = sanitizeProductFilters(plan.productFilters);
    const q = { userId: uid };
    if (pf.category) q.category = new RegExp(pf.category, 'i');
    if (pf.nameContains) {
      q.name = new RegExp(
        pf.nameContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
    }
    if (Number.isFinite(pf.minStock))
      q.units = { ...q.units, $gte: pf.minStock };
    if (Number.isFinite(pf.maxStock))
      q.units = { ...q.units, $lte: pf.maxStock };
    results.products = await Product.find(q).limit(40).lean();
  }

  if (plan.searchBills !== false) {
    const bf = sanitizeBillFilters(plan.billFilters);
    const bq = { userId: uid };
    if (bf.paymentStatus) bq.paymentStatus = bf.paymentStatus;
    if (bf.fromDate && !Number.isNaN(bf.fromDate.getTime())) {
      bq.createdAt = { ...bq.createdAt, $gte: bf.fromDate };
    }
    if (bf.toDate && !Number.isNaN(bf.toDate.getTime())) {
      bq.createdAt = { ...bq.createdAt, $lte: bf.toDate };
    }
    results.bills = await Bill.find(bq).sort({ createdAt: -1 }).limit(40).lean();
  }

  const summary = await chatComplete(
    [
      {
        role: 'system',
        content:
          'Summarize search results for the user in 2-4 sentences. Mention counts. Plain text.',
      },
      {
        role: 'user',
        content: `Query: ${query}\nProducts: ${results.products.length}, Bills: ${results.bills.length}\nTop product names: ${results.products
          .slice(0, 6)
          .map((p) => p.name)
          .join(', ')}`,
      },
    ],
    { maxTokens: 350 }
  );

  return { plan, results, summary };
}

export async function generateProductCopy(productStub) {
  const raw = await chatComplete(
    [
      {
        role: 'system',
        content:
          'Generate POS product copy as JSON only: {"description":string,"shortSummary":string,"seoText":string,"highlights":string[]}',
      },
      {
        role: 'user',
        content: JSON.stringify(productStub),
      },
    ],
    { jsonMode: true, maxTokens: 800 }
  );
  return safeParseJson(raw);
}

export async function generateBusinessInsights(userId, period) {
  const analytics = await getDashboardAnalytics(userId);
  const slice =
    period === 'weekly'
      ? {
          weeklySales: analytics.totals.weeklySales,
          note: 'weekly window uses rolling 7 days.',
        }
      : period === 'monthly'
        ? { monthlyRevenue: analytics.totals.monthlyRevenue }
        : {
            todaySales: analytics.totals.todaySales,
            yesterday: analytics.comparisons.yesterdaySales,
          };

  const raw = await chatComplete(
    [
      {
        role: 'system',
        content:
          'You are Quickbill AI. Given analytics JSON, return JSON ONLY: {"bullets": string[] } with 5-8 concise retailer insights.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          period,
          snapshot: analytics.totals,
          topProducts: analytics.topSellingProducts.slice(0, 5),
          categories: analytics.bestSellingCategories.slice(0, 4),
          slow: analytics.slowMovingProducts.slice(0, 4).map((p) => p.name),
          fast: analytics.fastMovingProducts.slice(0, 4).map((p) => p.name),
          peak: analytics.peakSalesTime,
          slice,
        }),
      },
    ],
    { jsonMode: true, maxTokens: 900 }
  );
  const parsed = safeParseJson(raw);
  return parsed?.bullets || [];
}

export async function generateExecutiveSummary(userId, period) {
  const analytics = await getDashboardAnalytics(userId);
  const text = await chatComplete(
    [
      {
        role: 'system',
        content:
          'Write a polished executive summary for a retail POS owner (120-220 words). Mention concrete metrics.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          period,
          totals: analytics.totals,
          pending: analytics.pendingPayments,
          profit: analytics.profitAnalysis,
          top: analytics.topSellingProducts.slice(0, 4),
          categories: analytics.bestSellingCategories.slice(0, 3),
        }),
      },
    ],
    { maxTokens: 600 }
  );
  return text;
}
