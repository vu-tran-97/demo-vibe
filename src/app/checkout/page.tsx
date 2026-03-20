'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { checkoutOrder, type PaymentMethod } from '@/lib/orders';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';
import layout from '@/app/cart/cart-page.module.css';
import styles from '@/app/dashboard/checkout/checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalItems, totalPrice } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

  function refreshAuth() {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }

  async function handleLogout() {
    await authLogout();
    setLoggedIn(false);
    setUser(null);
  }

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
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
        ...(shipAddr ? { shipAddr } : {}),
        ...(shipRcvrNm ? { shipRcvrNm } : {}),
        ...(shipTelno ? { shipTelno } : {}),
        ...(shipMemo ? { shipMemo } : {}),
      };
      const order = await checkoutOrder(payload);
      clearCart();
      router.push(`/checkout/success?orderNo=${encodeURIComponent(order.orderNo)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className={layout.page}>
      {/* ── Header ── */}
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <div className={layout.headerLeft}>
            <Link href="/" className={layout.logo}>Vibe</Link>
            <nav className={layout.breadcrumb}>
              <Link href="/" className={layout.breadcrumbLink}>Home</Link>
              <span className={layout.breadcrumbSep}>/</span>
              <Link href="/cart" className={layout.breadcrumbLink}>Cart</Link>
              <span className={layout.breadcrumbSep}>/</span>
              <span className={layout.breadcrumbCurrent}>Checkout</span>
            </nav>
          </div>
          <div className={layout.headerRight}>
            {loggedIn && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <button
                type="button"
                className={`${layout.headerBtn} ${layout.headerBtnPrimary}`}
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className={layout.main}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>&#9744;</div>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyDesc}>Add some items to your cart before checking out.</p>
            <Link href="/cart" className={styles.emptyLink}>Go to Cart</Link>
          </div>
        ) : (
          <div className={styles.checkout}>
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle} style={{ fontSize: '2.25rem' }}>Checkout</h2>
                <p className={styles.pageSubtitle}>{totalItems} item{totalItems !== 1 ? 's' : ''} in your order</p>
              </div>
              <Link href="/cart" className={styles.backLink}>Back to Cart</Link>
            </div>

            <div className={styles.checkoutLayout}>
              {/* Order Summary */}
              <div className={styles.summarySection}>
                <h3 className={styles.sectionTitle}>Order Summary</h3>
                {items.map((item) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={item.product.id} className={styles.summaryItem}>
                      <div className={styles.itemImage}>
                        {item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className={styles.itemImg} />}
                      </div>
                      <div className={styles.itemDetails}>
                        <p className={styles.itemName}>{item.product.name}</p>
                        <p className={styles.itemMeta}>Qty: {item.quantity} &times; {formatPrice(price)}</p>
                      </div>
                      <span className={styles.itemPrice}>{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
                <div className={styles.totalsCard}>
                  <div className={styles.totalsRow}>
                    <span className={styles.totalsLabel}>Subtotal ({totalItems} items)</span>
                    <span className={styles.totalsValue}>{formatPrice(totalPrice + totalSavings)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className={styles.totalsRow}>
                      <span className={styles.totalsLabel}>Discount</span>
                      <span className={styles.totalsValue}>&minus;{formatPrice(totalSavings)}</span>
                    </div>
                  )}
                  <div className={styles.totalsRow}>
                    <span className={styles.totalsLabel}>Shipping</span>
                    <span className={styles.totalsValue}>Free</span>
                  </div>
                  <div className={styles.totalsDivider} />
                  <div className={styles.totalsRow}>
                    <span className={styles.totalsGrandLabel}>Total</span>
                    <span className={styles.totalsGrandValue}>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping */}
              <div className={styles.paymentSection}>
                <h3 className={styles.paymentTitle}>Payment Method</h3>
                <div className={styles.methodCards}>
                  <div className={`${styles.methodCard} ${paymentMethod === 'BANK_TRANSFER' ? styles.methodCardActive : ''}`} onClick={() => setPaymentMethod('BANK_TRANSFER')}>
                    <div className={`${styles.methodRadio} ${paymentMethod === 'BANK_TRANSFER' ? styles.methodRadioActive : ''}`}>
                      {paymentMethod === 'BANK_TRANSFER' && <div className={styles.methodRadioDot} />}
                    </div>
                    <div className={styles.methodInfo}>
                      <p className={styles.methodName}>Bank Transfer</p>
                      <p className={styles.methodDesc}>Transfer to our bank account using the QR code or account details below.</p>
                    </div>
                  </div>
                  <div className={`${styles.methodCard} ${paymentMethod === 'EMAIL_INVOICE' ? styles.methodCardActive : ''}`} onClick={() => setPaymentMethod('EMAIL_INVOICE')}>
                    <div className={`${styles.methodRadio} ${paymentMethod === 'EMAIL_INVOICE' ? styles.methodRadioActive : ''}`}>
                      {paymentMethod === 'EMAIL_INVOICE' && <div className={styles.methodRadioDot} />}
                    </div>
                    <div className={styles.methodInfo}>
                      <p className={styles.methodName}>Email Invoice</p>
                      <p className={styles.methodDesc}>We will send an invoice with order details to your registered email.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.paymentDetails}>
                  {paymentMethod === 'BANK_TRANSFER' ? (
                    <div className={styles.qrSection}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-vibe-payment" alt="Payment QR Code" width={200} height={200} className={styles.qrImage} />
                      <div className={styles.bankInfo}>
                        <span className={styles.bankInfoStrong}>Demo Vibe Commerce Inc.</span>
                        Bank: Kookmin Bank<br />
                        Account: 123-456-789012<br />
                        Amount: {formatPrice(totalPrice)}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.invoiceInfo}>
                      <span className={styles.invoiceIcon}>&#9993;</span>
                      Invoice will be sent to your registered email address after order confirmation.
                    </div>
                  )}
                </div>

                <h4 className={styles.sectionTitle}>Shipping Information</h4>
                <div className={styles.shippingForm}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="chkRcvrNm">Receiver Name</label>
                    <input id="chkRcvrNm" type="text" className={styles.formInput} value={shipRcvrNm} onChange={(e) => setShipRcvrNm(e.target.value)} placeholder="Full name of the receiver" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="chkTelno">Phone Number</label>
                    <input id="chkTelno" type="tel" className={styles.formInput} value={shipTelno} onChange={(e) => setShipTelno(e.target.value)} placeholder="e.g. 010-1234-5678" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="chkAddr">Shipping Address</label>
                    <input id="chkAddr" type="text" className={styles.formInput} value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} placeholder="Full shipping address" />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel} htmlFor="chkMemo">Delivery Memo</label>
                    <textarea id="chkMemo" className={styles.formTextarea} value={shipMemo} onChange={(e) => setShipMemo(e.target.value)} placeholder="e.g. Leave at the front door" rows={2} />
                  </div>
                </div>

                {!loggedIn && (
                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#92400e' }}>
                    You are checking out as a guest. Your order will be confirmed, but you won&apos;t be able to view order history.{' '}
                    <button type="button" onClick={() => setAuthModalOpen(true)} style={{ color: '#d97706', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}>
                      Sign in
                    </button>{' '}to track your orders.
                  </div>
                )}

                {error && <p className={styles.errorMsg}>{error}</p>}

                <button type="button" className={styles.confirmBtn} disabled={submitting} onClick={handleConfirm}>
                  {submitting ? 'Processing...' : `Confirm Order — ${formatPrice(totalPrice)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={layout.footer}>
        <div className={layout.footerInner}>
          <div className={layout.footerGrid}>
            <div className={layout.footerBrand}>
              <div className={layout.footerLogo}>Vibe</div>
              <p className={layout.footerTagline}>
                A curated marketplace where every product tells a story and every interaction feels personal.
              </p>
            </div>
            <div className={layout.footerSection}>
              <h4>Shop</h4>
              <ul className={layout.footerLinks}>
                <li><Link href="/">All Products</Link></li>
                <li><Link href="/">New Arrivals</Link></li>
                <li><Link href="/">Best Sellers</Link></li>
                <li><Link href="/">Sale</Link></li>
              </ul>
            </div>
            <div className={layout.footerSection}>
              <h4>Support</h4>
              <ul className={layout.footerLinks}>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Shipping Info</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className={layout.footerSection}>
              <h4>Company</h4>
              <ul className={layout.footerLinks}>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className={layout.footerBottom}>
            <span>&copy; 2026 Vibe. All rights reserved.</span>
            <div className={layout.footerPayments}>
              Visa &middot; Mastercard &middot; Bank Transfer
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView="login"
        onSuccess={() => { setAuthModalOpen(false); refreshAuth(); }}
        stayOnPage
      />
      <ToastContainer />
    </div>
  );
}
