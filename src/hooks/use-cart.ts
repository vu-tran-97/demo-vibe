import { useState, useEffect, useCallback } from 'react';
import type { Product, CartItem } from '@/lib/products';

const CART_KEY = 'vibe_cart';
const CART_CHANGE_EVENT = 'vibe-cart-change';

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
  // Dispatch custom event so other components (e.g. sidebar badge) can sync
  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());

    // Listen for cart changes from other hook instances
    const handleChange = () => {
      setItems(loadCart());
    };
    window.addEventListener(CART_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CART_CHANGE_EVENT, handleChange);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const addItem = useCallback(
    (product: Product, quantity = 1): { success: boolean; message: string } => {
      const current = loadCart();
      const idx = current.findIndex((c) => c.product.id === product.id);
      const existingQty = idx >= 0 ? current[idx].quantity : 0;
      const newQty = existingQty + quantity;

      // Stock validation
      if (newQty > product.stock) {
        const canAdd = product.stock - existingQty;
        if (canAdd <= 0) {
          return {
            success: false,
            message: `Cannot add more — you already have ${existingQty} in cart (max ${product.stock})`,
          };
        }
        // Add only what we can
        if (idx >= 0) {
          current[idx].quantity = product.stock;
        } else {
          current.push({ product, quantity: canAdd });
        }
        persist(current);
        return {
          success: true,
          message: `Added ${canAdd} to cart (stock limit reached)`,
        };
      }

      if (idx >= 0) {
        current[idx].quantity = newQty;
      } else {
        current.push({ product, quantity });
      }
      persist(current);
      return {
        success: true,
        message: 'Added to cart',
      };
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
