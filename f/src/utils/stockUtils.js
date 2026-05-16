/** Units still available for a SKU given cart line items */
export function getAvailableUnits(products, productId, cartItems = [], excludeIndex = null) {
  const product = products.find((p) => String(p.id) === String(productId));
  if (!product) return 0;

  const reserved = cartItems.reduce((sum, item, index) => {
    if (excludeIndex != null && index === excludeIndex) return sum;
    if (String(item.productId) !== String(productId)) return sum;
    return sum + Number(item.quantity || 0);
  }, 0);

  return Math.max(0, Number(product.units || 0) - reserved);
}

export function validateBillStock(products, cartItems) {
  const needed = new Map();

  for (const item of cartItems) {
    const pid = String(item.productId);
    const qty = Number(item.quantity || 0);
    if (!pid || qty <= 0) {
      return { ok: false, message: 'Invalid line item quantity.' };
    }
    needed.set(pid, (needed.get(pid) || 0) + qty);
  }

  for (const [pid, qty] of needed.entries()) {
    const product = products.find((p) => String(p.id) === pid);
    if (!product) {
      return { ok: false, message: 'One or more products were not found.' };
    }
    const available = Number(product.units || 0);
    if (qty > available) {
      return {
        ok: false,
        message: `Insufficient stock for "${product.name}". Available: ${available}, requested: ${qty}.`,
      };
    }
  }

  return { ok: true };
}
