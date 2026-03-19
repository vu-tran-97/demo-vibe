'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { showToast, ToastContainer } from '@/components/toast/Toast';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import styles from './cart-page.module.css';

export default function MyCartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
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

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.logo}>Vibe</Link>
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.breadcrumbLink}>Home</Link>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>Shopping Cart</span>
            </nav>
          </div>
          <div className={styles.headerRight}>
            {loggedIn && user ? (
              <>
                <Link href="/orders" className={styles.headerBtn}>My Orders</Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <div className={styles.emptyIcon}>
              <svg className={styles.emptyIconSvg} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyDesc}>
              Discover our curated collection of unique products and find something you love.
            </p>
            <Link href="/" className={styles.emptyLink}>
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Shopping Cart</h1>
                <p className={styles.itemCount}>
                  {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
                </p>
              </div>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => { clearCart(); showToast('Cart cleared'); }}
              >
                Clear all
              </button>
            </div>

            {/* Cart Grid */}
            <div className={styles.cartLayout}>
              {/* Items */}
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
                                href={`/products/${item.product.id}`}
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
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              &minus;
                            </button>
                            <span className={styles.quantityValue}>{item.quantity}</span>
                            <button
                              type="button"
                              className={styles.quantityBtn}
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>
                          <div className={styles.priceGroup}>
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
                      &minus;{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping</span>
                  <span className={styles.freeShipping}>Free</span>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryTotal}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
                </div>

                <Link href="/checkout" className={styles.checkoutBtn}>
                  <span className={styles.checkoutIcon}>&#x2192;</span>
                  Proceed to Checkout
                </Link>

                <Link href="/" className={styles.continueLink}>
                  Continue Shopping
                </Link>

                <div className={styles.guarantees}>
                  <div className={styles.guarantee}>
                    <span className={styles.guaranteeIcon}>&#x2713;</span>
                    Free shipping on all orders
                  </div>
                  <div className={styles.guarantee}>
                    <span className={styles.guaranteeIcon}>&#x21BA;</span>
                    30-day hassle-free returns
                  </div>
                  <div className={styles.guarantee}>
                    <span className={styles.guaranteeIcon}>&#x26A1;</span>
                    Secure checkout with encryption
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>Vibe</div>
              <p className={styles.footerTagline}>
                A curated marketplace where every product tells a story and every interaction feels personal.
              </p>
            </div>
            <div className={styles.footerSection}>
              <h4>Shop</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/">All Products</Link></li>
                <li><Link href="/">New Arrivals</Link></li>
                <li><Link href="/">Best Sellers</Link></li>
                <li><Link href="/">Sale</Link></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>Support</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Shipping Info</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>Company</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>&copy; 2026 Vibe. All rights reserved.</span>
            <div className={styles.footerPayments}>
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
