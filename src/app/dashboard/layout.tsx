'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { GlobalSearchBar } from '@/components/global-search/GlobalSearchBar';
import { ToastContainer } from '@/components/toast/Toast';
import styles from './dashboard.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: '◎', roles: ['BUYER', 'SELLER', 'SUPER_ADMIN'] },
  { label: 'Products', href: '/dashboard/products', icon: '◇', roles: ['SELLER', 'SUPER_ADMIN'] },
  { label: 'My Products', href: '/dashboard/products/my', icon: '◈', roles: ['SELLER'] },
  { label: 'Cart', href: '/dashboard/cart', icon: '▣', roles: ['BUYER'] },
  { label: 'Orders', href: '/dashboard/orders', icon: '□', roles: ['BUYER'] },
  { label: 'Sales', href: '/dashboard/orders/sales', icon: '□', roles: ['SELLER'] },
  { label: 'Board', href: '/dashboard/board', icon: '☰', roles: ['BUYER', 'SELLER', 'SUPER_ADMIN'] },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: '◧', roles: ['SUPER_ADMIN'] },
  { label: 'Users', href: '/dashboard/admin/users', icon: '▣', roles: ['SUPER_ADMIN'] },
  { label: 'All Products', href: '/dashboard/products/my', icon: '◈', roles: ['SUPER_ADMIN'] },
];

const NAV_BOTTOM = [
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/products': 'Products',
  '/dashboard/products/my': 'My Products',
  '/dashboard/cart': 'Cart',
  '/dashboard/orders': 'Orders',
  '/dashboard/orders/sales': 'Sales',
  '/dashboard/board': 'Board',
  '/dashboard/settings': 'Settings',
  '/dashboard/admin': 'Admin',
  '/dashboard/admin/users': 'Users',
  '/dashboard/search': 'Search',
  '/dashboard/chat': 'Chat',
  '/dashboard/checkout': 'Checkout',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }
  // Check prefix matches for nested routes like /dashboard/products/[id]
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const prefix = '/' + segments.join('/');
    if (PAGE_TITLES[prefix]) {
      return PAGE_TITLES[prefix];
    }
  }
  return 'Overview';
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(href + '/');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, refresh } = useAuth(true);
  const { totalItems: cartCount } = useCart();
  const pathname = usePathname();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleSessionExpired() {
      setSessionExpired(true);
    }
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleReauth = useCallback(() => {
    setSessionExpired(false);
    refresh();
    window.dispatchEvent(new CustomEvent('session-restored'));
  }, [refresh]);

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  const displayName = user?.nickname || user?.name || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className={styles.layout}>
      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            Vibe
          </Link>
          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setMobileMenuOpen(false)}
          >
            &#x2715;
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.filter((item) => item.roles.includes(user?.role || '')).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isNavActive(pathname, item.href) ? styles.navItemActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.label === 'Cart' && cartCount > 0 && (
                    <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user?.role === 'SUPER_ADMIN' && (
          <div className={styles.adminSection}>
            <p className={styles.adminLabel}>Admin</p>
            <ul className={styles.navList}>
              {ADMIN_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${isNavActive(pathname, item.href) ? styles.navItemActive : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.sidebarBottom}>
          {NAV_BOTTOM.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isNavActive(pathname, item.href) ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            className={styles.navItem}
            onClick={logout}
          >
            <span className={styles.navIcon}>↗</span>
            <span className={styles.navLabel}>Log Out</span>
          </button>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userRole}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className={styles.pageTitle}>{getPageTitle(pathname)}</h1>
          </div>
          <div className={styles.topBarRight}>
            <GlobalSearchBar />
            <button type="button" className={styles.notifBtn}>
              <span className={styles.notifDot} />
              ◎
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>{children}</div>
      </main>

      {/* Session expired re-auth modal */}
      <AuthModal
        isOpen={sessionExpired}
        onClose={() => setSessionExpired(false)}
        initialView="login"
        onSuccess={handleReauth}
        stayOnPage
      />

      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  );
}
