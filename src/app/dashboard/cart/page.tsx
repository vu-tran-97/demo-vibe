'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { createOrder } from '@/lib/orders';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } =
    useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Checkout form fields
  const [shipAddr, setShipAddr] = useState('');
  const [shipRcvrNm, setShipRcvrNm] = useState('');
  const [shipTelno, setShipTelno] = useState('');
  const [shipMemo, setShipMemo] = useState('');

  const totalSavings = items.reduce((sum, item) => {
    if (item.product.salePrice !== null) {
      return (
        sum +
        (item.product.price - item.product.salePrice) * item.quantity
      );
    }
    return sum;
  }, 0);

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setCheckoutError(null);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        ...(shipAddr ? { shipAddr } : {}),
        ...(shipRcvrNm ? { shipRcvrNm } : {}),
        ...(shipTelno ? { shipTelno } : {}),
        ...(shipMemo ? { shipMemo } : {}),
      };

      await createOrder(payload);
      setOrderSuccess(true);
      clearCart();

      // Redirect to orders after a brief delay to show confirmation
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 2000);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Failed to place order',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !orderSuccess) {
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

  // Order success confirmation
  if (orderSuccess) {
    return (
      <div className={styles.emptyCart}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.emptyTitle}>Order Placed Successfully!</h2>
        <p className={styles.emptyDesc}>
          Your order has been placed. Redirecting to your orders...
        </p>
        <Link href="/dashboard/orders" className={styles.emptyLink}>
          View My Orders
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
        <button type="button" className={styles.clearBtn} onClick={clearCart}>
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
                <div className={styles.cartItemImage} />
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
                      onClick={() => removeItem(item.product.id)}
                    >
                      ✕
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

          <button
            type="button"
            className={styles.checkoutBtn}
            onClick={() => setShowCheckout(true)}
          >
            Proceed to Checkout
          </button>

          <Link href="/dashboard/products" className={styles.continueLink}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div
          className={styles.checkoutOverlay}
          onClick={() => !submitting && setShowCheckout(false)}
        >
          <div
            className={styles.checkoutModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.checkoutHeader}>
              <h2 className={styles.checkoutTitle}>Checkout</h2>
              <button
                type="button"
                className={styles.checkoutClose}
                onClick={() => !submitting && setShowCheckout(false)}
              >
                ✕
              </button>
            </div>

            {/* Order summary in modal */}
            <div className={styles.checkoutSummary}>
              <p className={styles.checkoutSummaryText}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} — Total:{' '}
                <strong>{formatPrice(totalPrice)}</strong>
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className={styles.checkoutForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="shipRcvrNm">
                  Receiver Name
                </label>
                <input
                  id="shipRcvrNm"
                  type="text"
                  className={styles.formInput}
                  value={shipRcvrNm}
                  onChange={(e) => setShipRcvrNm(e.target.value)}
                  placeholder="Full name of the receiver"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="shipTelno">
                  Phone Number
                </label>
                <input
                  id="shipTelno"
                  type="tel"
                  className={styles.formInput}
                  value={shipTelno}
                  onChange={(e) => setShipTelno(e.target.value)}
                  placeholder="e.g. 010-1234-5678"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="shipAddr">
                  Shipping Address
                </label>
                <input
                  id="shipAddr"
                  type="text"
                  className={styles.formInput}
                  value={shipAddr}
                  onChange={(e) => setShipAddr(e.target.value)}
                  placeholder="Full shipping address"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="shipMemo">
                  Delivery Memo
                </label>
                <textarea
                  id="shipMemo"
                  className={styles.formTextarea}
                  value={shipMemo}
                  onChange={(e) => setShipMemo(e.target.value)}
                  placeholder="e.g. Leave at the front door"
                  rows={3}
                />
              </div>

              {checkoutError && (
                <p className={styles.checkoutError}>{checkoutError}</p>
              )}

              <div className={styles.checkoutActions}>
                <button
                  type="button"
                  className={styles.checkoutCancelBtn}
                  disabled={submitting}
                  onClick={() => setShowCheckout(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.checkoutSubmitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Placing Order...' : `Place Order — ${formatPrice(totalPrice)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
