'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: '◎', roles: ['SELLER', 'SUPER_ADMIN'] },
  { label: 'Products', href: '/dashboard/products', icon: '◇', roles: ['SUPER_ADMIN'] },
  { label: 'My Products', href: '/dashboard/products/my', icon: '◈', roles: ['SELLER'] },
  { label: 'Orders', href: '/dashboard/orders/sales', icon: '□', roles: ['SELLER'] },
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
  const pathname = usePathname();
  const dashboardRouter = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Block buyers from dashboard — redirect to home
  useEffect(() => {
    if (!loading && user?.role === 'BUYER') {
      dashboardRouter.replace('/');
    }
  }, [user, loading, dashboardRouter]);

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
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="w-[32px] h-[32px] border-[2px] border-border border-t-charcoal rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.nickname || user?.name || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile overlay ── */}
      {mobileMenuOpen && (
        <div
          className="hidden max-md:block fixed inset-0 bg-[rgba(26,26,26,0.4)] backdrop-blur-[4px] z-[45] animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`w-[260px] bg-white border-r border-border-light flex flex-col fixed top-0 bottom-0 left-0 z-50 animate-slide-in-left max-md:transition-transform max-md:duration-[400ms] max-md:ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileMenuOpen
            ? 'max-md:translate-x-0'
            : 'max-md:-translate-x-full'
        }`}
      >
        <div className="p-[2rem] border-b border-border-light flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-[1.375rem] font-medium tracking-[-0.03em] text-charcoal"
          >
            Vibe
          </Link>
          <button
            type="button"
            className="hidden max-md:flex w-[32px] h-[32px] items-center justify-center bg-transparent border-none text-[1.125rem] text-muted cursor-pointer rounded-[4px] transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory"
            onClick={() => setMobileMenuOpen(false)}
          >
            &#x2715;
          </button>
        </div>

        <nav className="flex-1 py-[1.5rem] px-[1rem] overflow-y-auto">
          <ul className="list-none flex flex-col gap-[2px]">
            {NAV_ITEMS.filter((item) => item.roles.includes(user?.role || '')).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-[1rem] py-[0.625rem] px-[1rem] rounded-[8px] text-[0.875rem] font-normal text-slate transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer hover:bg-ivory hover:text-charcoal ${
                    isNavActive(pathname, item.href)
                      ? 'bg-ivory-warm text-charcoal font-medium'
                      : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={`w-[20px] text-center text-[1rem] ${isNavActive(pathname, item.href) ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
                  <span className="tracking-[0.01em]">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {user?.role === 'SUPER_ADMIN' && (
          <div className="py-[0.5rem] px-[1rem] mt-auto border-t border-border-light">
            <p className="text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em] py-[0.5rem] px-[1rem]">Admin</p>
            <ul className="list-none flex flex-col gap-[2px]">
              {ADMIN_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-[1rem] py-[0.625rem] px-[1rem] rounded-[8px] text-[0.875rem] font-normal text-slate transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer hover:bg-ivory hover:text-charcoal ${
                      isNavActive(pathname, item.href)
                        ? 'bg-ivory-warm text-charcoal font-medium'
                        : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={`w-[20px] text-center text-[1rem] ${isNavActive(pathname, item.href) ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
                    <span className="tracking-[0.01em]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-[1rem] border-t border-border-light flex flex-col gap-[0.5rem]">
          {NAV_BOTTOM.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-[1rem] py-[0.625rem] px-[1rem] rounded-[8px] text-[0.875rem] font-normal text-slate transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer hover:bg-ivory hover:text-charcoal ${
                isNavActive(pathname, item.href)
                  ? 'bg-ivory-warm text-charcoal font-medium'
                  : ''
              }`}
            >
              <span className={`w-[20px] text-center text-[1rem] ${isNavActive(pathname, item.href) ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
              <span className="tracking-[0.01em]">{item.label}</span>
            </Link>
          ))}

          <button
            type="button"
            className="flex items-center gap-[1rem] py-[0.625rem] px-[1rem] rounded-[8px] text-[0.875rem] font-normal text-slate transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer hover:bg-ivory hover:text-charcoal"
            onClick={logout}
          >
            <span className="w-[20px] text-center text-[1rem] opacity-70">↗</span>
            <span className="tracking-[0.01em]">Log Out</span>
          </button>

          <div className="flex items-center gap-[1rem] p-[1rem] mt-[0.5rem] rounded-[8px] bg-ivory">
            <div className="w-[36px] h-[36px] rounded-full bg-charcoal text-white flex items-center justify-center font-display text-[0.875rem] font-medium shrink-0 overflow-hidden">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-medium text-charcoal">{displayName}</p>
              <p className="text-[0.75rem] text-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-[260px] min-h-screen flex flex-col max-md:ml-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between py-[1.5rem] px-[3rem] border-b border-border-light bg-[rgba(250,250,247,0.9)] backdrop-blur-[12px] sticky top-0 z-40 animate-fade-in max-sm:py-[1rem] max-sm:px-[1.5rem]">
          <div className="flex items-center gap-[1.5rem]">
            <button
              type="button"
              className="hidden max-md:flex w-[36px] h-[36px] items-center justify-center bg-transparent border border-border rounded-[8px] text-slate cursor-pointer transition-all duration-[200ms] hover:border-charcoal hover:text-charcoal"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="font-display text-[1.5rem] font-normal">{getPageTitle(pathname)}</h1>
          </div>
          <div className="flex items-center gap-[1rem]" />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-[3rem] max-sm:p-[1.5rem]">{children}</div>
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
