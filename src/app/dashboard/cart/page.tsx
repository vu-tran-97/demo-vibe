'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { showToast } from '@/components/toast/Toast';
import styles from './cart.module.css';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } =
    useCart();

  const totalSavings = items.reduce((sum, item) => {
    if (item.product.salePrice !== null) {
      return (
        sum +
        (item.product.price - item.product.salePrice) * item.quantity
      );
    }
    return sum;
  }, 0);

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.emptyIcon}>□</div>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.emptyDesc}>
          Browse our curated collection and find something you love.
        </p>
        <Link href="/dashboard/products" className={styles.emptyLink}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Shopping Cart</h2>
          <p className={styles.itemCount}>
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" className={styles.clearBtn} onClick={() => { clearCart(); showToast('Cart cleared'); }}>
          Clear all
        </button>
      </div>

      <div className={styles.cartLayout}>
        {/* Cart Items */}
        <div className={styles.cartItems}>
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            return (
              <div key={item.product.id} className={styles.cartItem}>
                <div className={styles.cartItemImage}>
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className={styles.cartItemImg}
                    />
                  )}
                </div>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemTop}>
                    <div>
                      <h3 className={styles.cartItemName}>
                        <Link
                          href={`/dashboard/products/${item.product.id}`}
                          className={styles.cartItemNameLink}
                        >
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className={styles.cartItemSeller}>
                        by {item.product.seller.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => {
                        removeItem(item.product.id);
                        showToast(`Removed "${item.product.name}" from cart`);
                      }}
                    >
                      &#x2715;
                    </button>
                  </div>
                  <div className={styles.cartItemBottom}>
                    <div className={styles.quantityControl}>
                      <button
                        type="button"
                        className={styles.quantityBtn}
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className={styles.quantityValue}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className={styles.quantityBtn}
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    <div>
                      <span className={styles.cartItemPrice}>
                        {formatPrice(price * item.quantity)}
                      </span>
                      {item.product.salePrice !== null && (
                        <span className={styles.cartItemOriginal}>
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              Subtotal ({totalItems} items)
            </span>
            <span className={styles.summaryValue}>
              {formatPrice(totalPrice + totalSavings)}
            </span>
          </div>

          {totalSavings > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Discount</span>
              <span className={`${styles.summaryValue} ${styles.savingsValue}`}>
                −{formatPrice(totalSavings)}
              </span>
            </div>
          )}

          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Shipping</span>
            <span className={styles.summaryValue}>Free</span>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryTotal}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>
              {formatPrice(totalPrice)}
            </span>
          </div>

          <Link href="/dashboard/checkout" className={styles.checkoutBtn}>
            Proceed to Checkout
          </Link>

          <Link href="/dashboard/products" className={styles.continueLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
