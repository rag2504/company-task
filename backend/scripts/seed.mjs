/**
 * Seed demo owner + inventory + synthetic bills for Quickbill AI demos.
 * Run: npm run seed
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

const demoEmail = process.env.SEED_EMAIL || 'demo@quickbill.app';
const demoPassword = process.env.SEED_PASSWORD || 'demo12345';

const sampleProducts = [
  { name: 'Coca Cola 500ml', cat: 'Beverages', price: 40, cost: 28, units: 120 },
  { name: 'Pepsi 500ml', cat: 'Beverages', price: 38, cost: 26, units: 80 },
  { name: 'Milk 1L', cat: 'Dairy', price: 56, cost: 44, units: 35 },
  { name: 'Chips Salted', cat: 'Snacks', price: 20, cost: 12, units: 8 },
  {
    name: 'Dark Chocolate Bar',
    cat: 'Chocolates',
    price: 90,
    cost: 62,
    units: 45,
  },
  {
    name: 'Bread Loaf',
    cat: 'Packaged Foods',
    price: 45,
    cost: 30,
    units: 15,
  },
  { name: 'Biscuits Cream', cat: 'Snacks', price: 35, cost: 22, units: 60 },
  { name: 'Cold Coffee Can', cat: 'Beverages', price: 85, cost: 58, units: 5 },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    const hash = await User.hashPassword(demoPassword);
    user = await User.create({
      email: demoEmail,
      passwordHash: hash,
      name: 'Demo Store Owner',
      role: 'Owner',
    });
    console.log('Created demo user:', demoEmail);
  }

  await Bill.deleteMany({ userId: user._id });
  await Product.deleteMany({ userId: user._id });

  const products = [];
  for (const sp of sampleProducts) {
    const p = await Product.create({
      userId: user._id,
      name: sp.name,
      category: sp.cat,
      price: sp.price,
      cost: sp.cost,
      units: sp.units,
      weight: 500,
      description: `${sp.name} — fast-moving SKU`,
    });
    products.push(p);
  }

  const randPick = () => products[Math.floor(Math.random() * products.length)];

  const now = Date.now();
  for (let d = 0; d < 21; d++) {
    const dayOffset = d * 86400000;
    const billsPerDay = 3 + Math.floor(Math.random() * 5);
    for (let b = 0; b < billsPerDay; b++) {
      const p1 = randPick();
      let p2 = randPick();
      if (p2._id.toString() === p1._id.toString()) {
        p2 = products[(products.indexOf(p1) + 1) % products.length];
      }
      const hour = 10 + Math.floor(Math.random() * 11);
      const createdAt = new Date(now - dayOffset);
      createdAt.setHours(hour, Math.floor(Math.random() * 59), 0, 0);

      const q1 = 1 + Math.floor(Math.random() * 4);
      const items = [
        {
          productId: p1._id,
          productName: p1.name,
          quantity: q1,
          unitPrice: p1.price,
          totalPrice: p1.price * q1,
        },
      ];
      if (Math.random() > 0.35) {
        const q2 = 1 + Math.floor(Math.random() * 2);
        items.push({
          productId: p2._id,
          productName: p2.name,
          quantity: q2,
          unitPrice: p2.price,
          totalPrice: p2.price * q2,
        });
      }

      const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);
      const paymentStatus =
        Math.random() > 0.82
          ? 'pending'
          : Math.random() > 0.94
            ? 'partial'
            : 'paid';

      const bill = await Bill.create({
        userId: user._id,
        billNumber: `BILL-SEED-${d}-${b}-${Math.random().toString(36).slice(2, 7)}`,
        customerName:
          ['Walk-in', 'Riya', 'Aman', 'Guest'][Math.floor(Math.random() * 4)],
        customerPhone: `9${Math.floor(7000000000 + Math.random() * 299999999)}`,
        items,
        totalAmount,
        paymentStatus,
        paymentMethod: ['cash', 'upi', 'card'][Math.floor(Math.random() * 3)],
      });

      await Bill.collection.updateOne(
        { _id: bill._id },
        { $set: { createdAt, updatedAt: createdAt } }
      );
    }
  }

  console.log('Seed complete. Login:', demoEmail, '/', demoPassword);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
