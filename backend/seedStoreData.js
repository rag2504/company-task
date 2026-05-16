
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Bill } from './models/Bill.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected');
  } catch (error) {
    console.log('MongoDB Error:', error.message);
    process.exit(1);
  }
};

const random = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const productData = [
  {
    name: 'Coca Cola 500ml',
    units: 120,
    weight: 500,
    price: 40,
    cost: 28,
    category: 'Beverages',
  },
  {
    name: 'Pepsi 750ml',
    units: 90,
    weight: 750,
    price: 50,
    cost: 35,
    category: 'Beverages',
  },
  {
    name: 'Dairy Milk Silk',
    units: 70,
    weight: 120,
    price: 180,
    cost: 140,
    category: 'Chocolate',
  },
  {
    name: 'Lay’s Magic Masala',
    units: 150,
    weight: 52,
    price: 20,
    cost: 12,
    category: 'Snacks',
  },
  {
    name: 'Amul Butter',
    units: 45,
    weight: 500,
    price: 280,
    cost: 240,
    category: 'Dairy',
  },
  {
    name: 'Aashirvaad Atta',
    units: 60,
    weight: 5000,
    price: 320,
    cost: 270,
    category: 'Groceries',
  },
  {
    name: 'Maggi Noodles',
    units: 200,
    weight: 70,
    price: 15,
    cost: 10,
    category: 'Instant Food',
  },
  {
    name: 'Red Bull',
    units: 35,
    weight: 250,
    price: 125,
    cost: 90,
    category: 'Energy Drink',
  },
  {
    name: 'Good Day Biscuits',
    units: 110,
    weight: 100,
    price: 30,
    cost: 20,
    category: 'Biscuits',
  },
  {
    name: 'Tata Salt',
    units: 75,
    weight: 1000,
    price: 28,
    cost: 18,
    category: 'Groceries',
  },
  {
    name: 'Sprite 2L',
    units: 50,
    weight: 2000,
    price: 99,
    cost: 78,
    category: 'Beverages',
  },
  {
    name: 'KitKat',
    units: 140,
    weight: 40,
    price: 25,
    cost: 15,
    category: 'Chocolate',
  },
  {
    name: 'Parle-G',
    units: 180,
    weight: 150,
    price: 10,
    cost: 6,
    category: 'Biscuits',
  },
  {
    name: 'Bru Coffee',
    units: 40,
    weight: 200,
    price: 210,
    cost: 170,
    category: 'Beverages',
  },
  {
    name: 'Fortune Oil',
    units: 30,
    weight: 1000,
    price: 190,
    cost: 160,
    category: 'Groceries',
  },
];

const customerNames = [
  'Rahul Sharma',
  'Priya Patel',
  'Amit Verma',
  'Sneha Joshi',
  'Karan Mehta',
  'Riya Shah',
  'Jay Patel',
  'Anjali Desai',
  'Raj Malhotra',
  'Pooja Jain',
  'Yash Trivedi',
  'Neha Kapoor',
  'Vivek Singh',
  'Rohan Das',
  'Aarav Shah',
  'Simran Kaur',
  'Dhruv Patel',
  'Nidhi Mehta',
  'Harsh Vora',
  'Mihir Shah',
  'Aryan Patel',
  'Meera Joshi',
  'Krishna Shah',
  'Tina Patel',
  'Suresh Kumar',
  'Deep Patel',
  'Rakesh Sharma',
  'Manav Shah',
  'Ishita Mehta',
  'Dev Patel',
];

const paymentStatuses = ['paid', 'pending', 'partial'];
const paymentMethods = ['cash', 'upi', 'card', 'credit'];

const seedData = async () => {
  try {
    await connectDB();

    const user = await User.findOne({
      email: 'rag@gmail.com',
    });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('User Found:', user.email);

    await Product.deleteMany({
      userId: user._id,
    });

    await Bill.deleteMany({
      userId: user._id,
    });

    console.log('Old Data Removed');

    const createdProducts = [];

    for (const p of productData) {
      const product = await Product.create({
        userId: user._id,
        name: p.name,
        units: p.units,
        weight: p.weight,
        price: p.price,
        cost: p.cost,
        category: p.category,

        description:
          p.name + ' premium quality product for daily usage.',

        aiDescription:
          p.name +
          ' is one of the best selling items in the ' +
          p.category +
          ' category.',

        aiShortSummary:
          'Top selling product from ' + p.category + ' category.',

        aiSeoText:
          'Buy ' + p.name + ' online at the best price.',

        aiHighlights: [
          'High Quality',
          'Best Seller',
          'Fresh Stock',
        ],
      });

      createdProducts.push(product);
    }

    console.log('Products Created');

    for (let i = 0; i < 30; i++) {
      const items = [];

      const itemCount = Math.floor(Math.random() * 4) + 1;

      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = random(createdProducts);

        const quantity =
          Math.floor(Math.random() * 5) + 1;

        const totalPrice =
          quantity * product.price;

        totalAmount += totalPrice;

        items.push({
          productId: product._id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice,
        });
      }

      await Bill.create({
        userId: user._id,

        billNumber: 'BILL-' + (1001 + i),

        customerName: customerNames[i],

        customerPhone:
          '98' +
          Math.floor(
            10000000 + Math.random() * 89999999
          ),

        items,

        totalAmount,

        paymentStatus: random(paymentStatuses),

        paymentMethod: random(paymentMethods),

        createdAt: new Date(
          Date.now() -
            Math.floor(Math.random() * 15) *
              24 *
              60 *
              60 *
              1000
        ),
      });
    }

    console.log('Bills Created');
    console.log('Database Seeded Successfully');

    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedData();
