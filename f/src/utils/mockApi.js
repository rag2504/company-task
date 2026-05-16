import {
  getCurrentUser,
  getUserProducts,
  setUserProducts,
  getUserBills,
  setUserBills,
  updateUserStats,
} from './userManager';
import { api, apiEnabled } from '../services/client';
import { validateBillStock } from './stockUtils';

const API_DELAY = 300;
const simulateDelay = (ms = API_DELAY) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getNextProductId = (userId) => {
  const products = getUserProducts(userId);
  const maxId = products.reduce((max, product) => {
    const numId = parseInt(product.id, 10) || 0;
    return numId > max ? numId : max;
  }, 0);
  return String(maxId + 1);
};

const getNextBillId = (userId) => {
  const bills = getUserBills(userId);
  const maxId = bills.reduce((max, bill) => {
    const numId = parseInt(bill.id, 10) || 0;
    return numId > max ? numId : max;
  }, 0);
  return String(maxId + 1);
};

export function mapProduct(p) {
  if (!p) return p;
  const id = p._id ?? p.id;
  return {
    ...p,
    id: typeof id === 'object' ? id.toString() : String(id),
  };
}

export function mapBill(b) {
  if (!b) return b;
  const id = b._id ?? b.id;
  const items = (b.items || []).map((i) => {
    let pid = i.productId;
    if (pid && typeof pid === 'object') {
      pid = pid._id ?? pid.id;
    }
    return {
      ...i,
      productId:
        pid && typeof pid === 'object' ? pid.toString() : String(pid ?? ''),
    };
  });
  return {
    ...b,
    id: typeof id === 'object' ? id.toString() : String(id),
    items,
  };
}

/** Backend + JWT session */
function remote() {
  return apiEnabled();
}

export const productsApi = {
  getAll: async () => {
    if (remote()) {
      const { data } = await api.get('/products');
      return data.map(mapProduct);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    return getUserProducts(currentUser.id);
  },

  getById: async (id) => {
    if (remote()) {
      const { data } = await api.get(`/products/${id}`);
      return mapProduct(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const product = products.find((p) => String(p.id) === String(id));
    if (!product) throw new Error('Product not found');
    return product;
  },

  create: async (productData) => {
    if (remote()) {
      const { data } = await api.post('/products', {
        ...productData,
        cost: productData.cost ?? 0,
      });
      return mapProduct(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const newProduct = {
      ...productData,
      id: getNextProductId(currentUser.id),
      price: Number(productData.price),
      units: Number(productData.units),
      weight: Number(productData.weight),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedProducts = [...products, newProduct];
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    return newProduct;
  },

  update: async (id, productData) => {
    if (remote()) {
      const { data } = await api.put(`/products/${id}`, {
        ...productData,
        cost: productData.cost ?? 0,
      });
      return mapProduct(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const productIndex = products.findIndex((p) => String(p.id) === String(id));
    if (productIndex === -1) throw new Error('Product not found');
    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      id: String(id),
      price: Number(productData.price),
      units: Number(productData.units),
      weight: Number(productData.weight),
      updatedAt: new Date().toISOString(),
    };
    const updatedProducts = [...products];
    updatedProducts[productIndex] = updatedProduct;
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    return updatedProduct;
  },

  delete: async (id) => {
    if (remote()) {
      await api.delete(`/products/${id}`);
      return { message: 'Product deleted successfully' };
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const updatedProducts = products.filter((p) => String(p.id) !== String(id));
    if (products.length === updatedProducts.length) {
      throw new Error('Product not found');
    }
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    return { message: 'Product deleted successfully' };
  },
};

export const billsApi = {
  getAll: async () => {
    if (remote()) {
      const { data } = await api.get('/bills');
      return data.map(mapBill);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    return getUserBills(currentUser.id);
  },

  getById: async (id) => {
    if (remote()) {
      const { data } = await api.get(`/bills/${id}`);
      return mapBill(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const bill = bills.find((b) => String(b.id) === String(id));
    if (!bill) throw new Error('Bill not found');
    return bill;
  },

  create: async (billData) => {
    if (remote()) {
      const { data } = await api.post('/bills', billData);
      return mapBill(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const products = getUserProducts(currentUser.id);
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newBill = {
      ...billData,
      id: getNextBillId(currentUser.id),
      billNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (billData.items && billData.items.length > 0) {
      const stockCheck = validateBillStock(products, billData.items);
      if (!stockCheck.ok) {
        throw new Error(stockCheck.message);
      }

      const qtyByProduct = new Map();
      for (const item of billData.items) {
        const pid = String(item.productId);
        qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + Number(item.quantity));
      }

      const updatedProducts = products.map((product) => {
        const deduct = qtyByProduct.get(String(product.id));
        if (deduct) {
          return {
            ...product,
            units: (product.units || 0) - deduct,
          };
        }
        return product;
      });
      setUserProducts(currentUser.id, updatedProducts);
    }
    const updatedBills = [...bills, newBill];
    setUserBills(currentUser.id, updatedBills);
    updateUserStats(currentUser.id);
    return newBill;
  },

  update: async (id, billData) => {
    if (remote()) {
      const { data } = await api.put(`/bills/${id}`, billData);
      return mapBill(data);
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const bill = bills.find((b) => String(b.id) === String(id));
    if (!bill) throw new Error('Bill not found');
    const billIndex = bills.findIndex((b) => String(b.id) === String(id));
    const updatedBill = {
      ...bills[billIndex],
      ...billData,
      id: String(id),
      updatedAt: new Date().toISOString(),
    };
    const updatedBills = [...bills];
    updatedBills[billIndex] = updatedBill;
    setUserBills(currentUser.id, updatedBills);
    updateUserStats(currentUser.id);
    return updatedBill;
  },

  delete: async (id) => {
    if (remote()) {
      await api.delete(`/bills/${id}`);
      return { message: 'Bill deleted successfully' };
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const updatedBills = bills.filter((b) => String(b.id) !== String(id));
    if (bills.length === updatedBills.length) {
      throw new Error('Bill not found');
    }
    setUserBills(currentUser.id, updatedBills);
    updateUserStats(currentUser.id);
    return { message: 'Bill deleted successfully' };
  },
};

export const statsApi = {
  get: async () => {
    if (remote()) {
      const { data } = await api.get('/dashboard/stats');
      return data;
    }
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const bills = getUserBills(currentUser.id);
    return {
      totalProducts: products.length,
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      lowStockProducts: products.filter((p) => (p.units || 0) < 10).length,
    };
  },
};

export const mockApi = {
  products: productsApi,
  bills: billsApi,
  stats: statsApi,
};
