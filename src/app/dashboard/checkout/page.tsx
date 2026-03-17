'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import {
  checkoutOrder,
  payOrder,
  type PaymentMethod,
} from '@/lib/orders';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalItems, totalPrice } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [shipAddr, setShipAddr] = useState('');
  const [shipRcvrNm, setShipRcvrNm] = useState('');
  const [shipTelno, setShipTelno] = useState('');
  const [shipMemo, setShipMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalSavings = items.reduce((sum, item) => {
    if (item.product.salePrice !== null) {
      return sum + (item.product.price - item.product.salePrice) * item.quantity;
    }
    return sum;
  }, 0);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod,
        ...(shipAddr ? { shipAddr } : {}),
        ...(shipRcvrNm ? { shipRcvrNm } : {}),
        ...(shipTelno ? { shipTelno } : {}),
        ...(shipMemo ? { shipMemo } : {}),
      };

      // Create order with payment method
      const order = await checkoutOrder(payload);

      // Mark order as paid
      await payOrder(order.id, paymentMethod);

      clearCart();

      // Redirect to success page with order number
      router.push(
        `/dashboard/checkout/success?orderNo=${encodeURIComponent(order.orderNo)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to place order',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Wait for client-side hydration before checking cart
  if (!mounted) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>&#9744;</div>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.emptyDesc}>
          Add some items to your cart before checking out.
        </p>
        <Link href="/dashboard/cart" className={styles.emptyLink}>
          Go to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.checkout}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Checkout</h2>
          <p className={styles.pageSubtitle}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your order
          </p>
        </div>
        <Link href="/dashboard/cart" className={styles.backLink}>
          Back to Cart
        </Link>
      </div>

      <div className={styles.checkoutLayout}>
        {/* Left: Order Summary */}
        <div className={styles.summarySection}>
          <h3 className={styles.sectionTitle}>Order Summary</h3>

          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            return (
              <div key={item.product.id} className={styles.summaryItem}>
                <div className={styles.itemImage}>
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className={styles.itemImg}
                    />
                  )}
                </div>
                <div className={styles.itemDetails}>
                  <p className={styles.itemName}>{item.product.name}</p>
                  <p className={styles.itemMeta}>
                    Qty: {item.quantity} &times; {formatPrice(price)}
                  </p>
                </div>
                <span className={styles.itemPrice}>
                  {formatPrice(price * item.quantity)}
                </span>
              </div>
            );
          })}

          {/* Totals */}
          <div className={styles.totalsCard}>
            <div className={styles.totalsRow}>
              <span className={styles.totalsLabel}>
                Subtotal ({totalItems} items)
              </span>
              <span className={styles.totalsValue}>
                {formatPrice(totalPrice + totalSavings)}
              </span>
            </div>
            {totalSavings > 0 && (
              <div className={styles.totalsRow}>
                <span className={styles.totalsLabel}>Discount</span>
                <span className={styles.totalsValue}>
                  &minus;{formatPrice(totalSavings)}
                </span>
              </div>
            )}
            <div className={styles.totalsRow}>
              <span className={styles.totalsLabel}>Shipping</span>
              <span className={styles.totalsValue}>Free</span>
            </div>
            <div className={styles.totalsDivider} />
            <div className={styles.totalsRow}>
              <span className={styles.totalsGrandLabel}>Total</span>
              <span className={styles.totalsGrandValue}>
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method + Shipping */}
        <div className={styles.paymentSection}>
          <h3 className={styles.paymentTitle}>Payment Method</h3>

          {/* Method Cards */}
          <div className={styles.methodCards}>
            <div
              className={`${styles.methodCard} ${paymentMethod === 'BANK_TRANSFER' ? styles.methodCardActive : ''}`}
              onClick={() => setPaymentMethod('BANK_TRANSFER')}
            >
              <div
                className={`${styles.methodRadio} ${paymentMethod === 'BANK_TRANSFER' ? styles.methodRadioActive : ''}`}
              >
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className={styles.methodRadioDot} />
                )}
              </div>
              <div className={styles.methodInfo}>
                <p className={styles.methodName}>Bank Transfer</p>
                <p className={styles.methodDesc}>
                  Transfer to our bank account using the QR code or account details below.
                </p>
              </div>
            </div>

            <div
              className={`${styles.methodCard} ${paymentMethod === 'EMAIL_INVOICE' ? styles.methodCardActive : ''}`}
              onClick={() => setPaymentMethod('EMAIL_INVOICE')}
            >
              <div
                className={`${styles.methodRadio} ${paymentMethod === 'EMAIL_INVOICE' ? styles.methodRadioActive : ''}`}
              >
                {paymentMethod === 'EMAIL_INVOICE' && (
                  <div className={styles.methodRadioDot} />
                )}
              </div>
              <div className={styles.methodInfo}>
                <p className={styles.methodName}>Email Invoice</p>
                <p className={styles.methodDesc}>
                  We will send an invoice with order details to your registered email.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className={styles.paymentDetails}>
            {paymentMethod === 'BANK_TRANSFER' ? (
              <div className={styles.qrSection}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-vibe-payment"
                  alt="Payment QR Code"
                  width={200}
                  height={200}
                  className={styles.qrImage}
                />
                <div className={styles.bankInfo}>
                  <span className={styles.bankInfoStrong}>
                    Demo Vibe Commerce Inc.
                  </span>
                  Bank: Kookmin Bank
                  <br />
                  Account: 123-456-789012
                  <br />
                  Amount: {formatPrice(totalPrice)}
                </div>
              </div>
            ) : (
              <div className={styles.invoiceInfo}>
                <span className={styles.invoiceIcon}>&#9993;</span>
                Invoice will be sent to your registered email address after order
                confirmation.
              </div>
            )}
          </div>

          {/* Shipping Info */}
          <h4 className={styles.sectionTitle}>Shipping Information</h4>
          <div className={styles.shippingForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chkRcvrNm">
                Receiver Name
              </label>
              <input
                id="chkRcvrNm"
                type="text"
                className={styles.formInput}
                value={shipRcvrNm}
                onChange={(e) => setShipRcvrNm(e.target.value)}
                placeholder="Full name of the receiver"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chkTelno">
                Phone Number
              </label>
              <input
                id="chkTelno"
                type="tel"
                className={styles.formInput}
                value={shipTelno}
                onChange={(e) => setShipTelno(e.target.value)}
                placeholder="e.g. 010-1234-5678"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chkAddr">
                Shipping Address
              </label>
              <input
                id="chkAddr"
                type="text"
                className={styles.formInput}
                value={shipAddr}
                onChange={(e) => setShipAddr(e.target.value)}
                placeholder="Full shipping address"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="chkMemo">
                Delivery Memo
              </label>
              <textarea
                id="chkMemo"
                className={styles.formTextarea}
                value={shipMemo}
                onChange={(e) => setShipMemo(e.target.value)}
                placeholder="e.g. Leave at the front door"
                rows={2}
              />
            </div>
          </div>

          {/* Error */}
          {error && <p className={styles.errorMsg}>{error}</p>}

          {/* Confirm */}
          <button
            type="button"
            className={styles.confirmBtn}
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting
              ? 'Processing...'
              : `Confirm Order — ${formatPrice(totalPrice)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
