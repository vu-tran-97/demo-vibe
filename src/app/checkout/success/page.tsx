'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { ToastContainer } from '@/components/toast/Toast';
import layout from '@/app/cart/cart-page.module.css';
import styles from '@/app/dashboard/checkout/success/success.module.css';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo') || 'N/A';
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

  async function handleLogout() {
    await authLogout();
    setLoggedIn(false);
    setUser(null);
    router.replace('/');
  }

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
              <span className={layout.breadcrumbCurrent}>Order Confirmed</span>
            </nav>
          </div>
          <div className={layout.headerRight}>
            {loggedIn && user && (
              <UserMenu user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className={layout.main}>
        <div className={styles.success}>
          <div className={styles.successIcon}>&#10003;</div>
          <h2 className={styles.title}>Order Confirmed!</h2>
          <p className={styles.subtitle}>
            Your order has been placed successfully. The seller will review and process it shortly.
          </p>
          <div className={styles.orderCard}>
            <p className={styles.orderLabel}>Order Number</p>
            <p className={styles.orderNumber}>{orderNo}</p>
          </div>
          <div className={styles.actions}>
            {loggedIn ? (
              <Link href="/orders" className={styles.primaryLink}>
                View My Orders
              </Link>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                Sign in to track your order history
              </p>
            )}
            <Link href="/" className={loggedIn ? styles.secondaryLink : styles.primaryLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
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

      <ToastContainer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
