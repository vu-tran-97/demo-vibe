import { useState, useEffect, useCallback } from 'react';
import type { Product, CartItem } from '@/lib/products';

const CART_KEY = 'vibe_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      const current = loadCart();
      const idx = current.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        current[idx].quantity += quantity;
      } else {
        current.push({ product, quantity });
      }
      persist(current);
    },
    [persist],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const current = loadCart();
      const idx = current.findIndex((c) => c.product.id === productId);
      if (idx >= 0) {
        if (quantity <= 0) {
          current.splice(idx, 1);
        } else {
          current[idx].quantity = quantity;
        }
        persist(current);
      }
    },
    [persist],
  );

  const removeItem = useCallback(
    (productId: string) => {
      const current = loadCart().filter((c) => c.product.id !== productId);
      persist(current);
    },
    [persist],
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalItems = items.reduce((sum, c) => sum + c.quantity, 0);
  const totalPrice = items.reduce(
    (sum, c) => sum + (c.product.salePrice ?? c.product.price) * c.quantity,
    0,
  );

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  };
}
