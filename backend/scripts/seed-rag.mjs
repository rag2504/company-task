/**
 * Seed Quickbill data for rag@gmail.com
 * Run: npm run seed:rag
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Bill } from '../src/models/Bill.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI in backend/.env');
  process.exit(1);
}

const EMAIL = 'rag@gmail.com';
const PASSWORD = 'Rag@123456';
const NAME = 'Rag Owner';

const sampleProducts = [
  { name: 'Coca Cola 500ml', cat: 'Beverages', price: 40, cost: 28, units: 120 },
  { name: 'Pepsi 500ml', cat: 'Beverages', price: 38, cost: 26, units: 80 },
  { name: 'Milk 1L', cat: 'Dairy', price: 56, cost: 44, units: 35 },
  { name: 'Cooking Oil (1L)', cat: 'Edible Oils & Ghee', price: 180, cost: 145, units: 20 },
  { name: 'Chips Salted', cat: 'Snacks', price: 20, cost: 12, units: 8 },
  { name: 'Dark Chocolate Bar', cat: 'Chocolates', price: 90, cost: 62, units: 45 },
  { name: 'Bread Loaf', cat: 'Bakery & Dairy', price: 45, cost: 30, units: 15 },
  { name: 'Biscuits Cream', cat: 'Snacks', price: 35, cost: 22, units: 60 },
  { name: 'Rice 5kg', cat: 'Rice, Dal & Grains', price: 320, cost: 280, units: 25 },
  { name: 'Cold Coffee Can', cat: 'Beverages', price: 85, cost: 58, units: 5 },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  const passwordHash = await User.hashPassword(PASSWORD);
  let user = await User.findOne({ email: EMAIL.toLowerCase() }).select(
    '+passwordHash'
  );

  if (!user) {
    user = await User.create({
      email: EMAIL.toLowerCase(),
      passwordHash,
      name: NAME,
      role: 'Owner',
    });
    console.log('Created user:', EMAIL);
  } else {
    user.passwordHash = passwordHash;
    user.name = NAME;
    user.role = 'Owner';
    user.isActive = true;
    await user.save();
    console.log('Updated user password:', EMAIL);
  }

  await Bill.deleteMany({ userId: user._id });
  await Product.deleteMany({ userId: user._id });

  const products = [];
  for (const sp of sampleProducts) {
    products.push(
      await Product.create({
        userId: user._id,
        name: sp.name,
        category: sp.cat,
        price: sp.price,
        cost: sp.cost,
        units: sp.units,
        weight: 500,
        description: `${sp.name} — stocked for Quickbill demo`,
      })
    );
  }

  const pick = () => products[Math.floor(Math.random() * products.length)];
  const now = Date.now();

  for (let d = 0; d < 14; d++) {
    const createdAt = new Date(now - d * 86400000);
    createdAt.setHours(11 + (d % 8), 30, 0, 0);

    const p1 = pick();
    const p2 = pick();
    const q1 = 1 + (d % 3);
    const items = [
      {
        productId: p1._id,
        productName: p1.name,
        quantity: q1,
        unitPrice: p1.price,
        totalPrice: p1.price * q1,
      },
    ];

    const bill = await Bill.create({
      userId: user._id,
      billNumber: `BILL-RAG-${d}-${Date.now().toString(36).slice(-4)}`,
      customerName: ['Walk-in', 'Priya', 'Amit', 'Rag Customer'][d % 4],
      customerPhone: `98765${String(43210 + d).slice(-5)}`,
      items,
      totalAmount: items.reduce((s, i) => s + i.totalPrice, 0),
      paymentStatus: d % 5 === 0 ? 'pending' : 'paid',
      paymentMethod: ['cash', 'upi', 'card'][d % 3],
    });

    await Bill.collection.updateOne(
      { _id: bill._id },
      { $set: { createdAt, updatedAt: createdAt } }
    );

    await Product.findByIdAndUpdate(p1._id, { $inc: { units: -q1 } });
  }

  console.log('\n✅ Rag account ready');
  console.log('   Email   :', EMAIL);
  console.log('   Password:', PASSWORD);
  console.log('   Products:', products.length);
  console.log('   Sample bills: 14 (stock adjusted)\n');

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
