import mongoose from 'mongoose';
import { Bill } from '../models/Bill.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

function uid(req) {
  return req.user._id;
}

async function restoreStockForBill(bill) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { units: item.quantity } },
        { session }
      );
    }
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

async function decrementStockForItems(userId, items) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    for (const item of items) {
      const prod = await Product.findOne({
        _id: item.productId,
        userId,
      }).session(session);
      if (!prod) {
        throw new AppError(`Product ${item.productId} not found`, 400);
      }
      if (prod.units < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${prod.name}". Available: ${prod.units}, requested: ${item.quantity}.`,
          400
        );
      }
      prod.units -= item.quantity;
      await prod.save({ session });
    }
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function listBills(req) {
  return Bill.find({ userId: uid(req) })
    .populate('items.productId')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getBill(req) {
  const b = await Bill.findOne({
    _id: req.params.id,
    userId: uid(req),
  }).populate('items.productId');
  if (!b) throw new AppError('Bill not found', 404);
  return b;
}

function aggregateItems(items) {
  const map = new Map();
  for (const item of items) {
    const pid = String(item.productId);
    const qty = Number(item.quantity);
    if (!pid || !Number.isFinite(qty) || qty < 1) {
      throw new AppError('Each line item needs a valid product and quantity', 400);
    }
    map.set(pid, (map.get(pid) || 0) + qty);
  }
  return [...map.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export async function createBill(req) {
  const body = req.body;
  const items = body.items || [];
  if (!items.length) {
    throw new AppError('Bill needs at least one line item', 400);
  }

  const aggregated = aggregateItems(items);
  await decrementStockForItems(uid(req), aggregated);

  const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const bill = await Bill.create({
    userId: uid(req),
    billNumber,
    customerName: body.customerName || 'Walk-in Customer',
    customerPhone: body.customerPhone || '',
    items: items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    totalAmount: Number(body.totalAmount),
    paymentStatus: body.paymentStatus || 'pending',
    paymentMethod: body.paymentMethod || 'cash',
  });

  return Bill.findById(bill._id).populate('items.productId');
}

/** Safe updates only — avoids inventory drift */
export async function updateBill(req) {
  const bill = await Bill.findOne({ _id: req.params.id, userId: uid(req) });
  if (!bill) throw new AppError('Bill not found', 404);

  const allowed = [
    'paymentStatus',
    'paymentMethod',
    'customerName',
    'customerPhone',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) bill[key] = req.body[key];
  }
  await bill.save();
  return Bill.findById(bill._id).populate('items.productId');
}

export async function deleteBill(req) {
  const bill = await Bill.findOne({ _id: req.params.id, userId: uid(req) });
  if (!bill) throw new AppError('Bill not found', 404);
  await restoreStockForBill(bill);
  await bill.deleteOne();
  return { message: 'Bill deleted successfully' };
}
