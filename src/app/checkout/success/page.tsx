'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { ToastContainer } from '@/components/toast/Toast';

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
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* ── Header ── */}
      <header className="sticky top-0 z-100 bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto py-[0.75rem] px-[2rem] flex items-center justify-between max-sm:px-[1rem]">
          <div className="flex items-center gap-[2rem]">
            <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] no-underline">Vibe</Link>
            <nav className="flex items-center gap-[0.5rem] text-[0.8125rem] text-muted max-sm:hidden">
              <Link href="/" className="text-slate no-underline transition-colors duration-[200ms] hover:text-gold-dark">Home</Link>
              <span className="opacity-40">/</span>
              <span className="text-charcoal font-medium">Order Confirmed</span>
            </nav>
          </div>
          <div className="flex items-center gap-[1rem] ml-auto shrink-0">
            {loggedIn && user && (
              <UserMenu user={user} onLogout={handleLogout} />
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto py-[3rem] px-[2rem] max-sm:py-[1.5rem] max-sm:px-[1rem]">
        <div className="text-center py-[8rem] px-[2rem] max-w-[520px] mx-auto max-sm:py-[4rem] max-sm:px-[1rem]">
          <div className="text-[3rem] w-[80px] h-[80px] flex items-center justify-center mx-auto mb-[2rem] bg-[rgba(90,138,106,0.08)] text-success rounded-full font-light">&#10003;</div>
          <h2 className="font-display text-[1.75rem] font-normal text-charcoal mb-[0.5rem]">Order Confirmed!</h2>
          <p className="text-[0.9375rem] text-muted mb-[3rem]">
            Your order has been placed successfully. The seller will review and process it shortly.
          </p>
          <div className="bg-ivory rounded-[12px] py-[2rem] px-[3rem] mb-[3rem] max-sm:p-[1.5rem]">
            <p className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.06em] mb-[0.25rem]">Order Number</p>
            <p className="font-display text-[1.5rem] font-medium text-charcoal tracking-[0.02em] max-sm:text-[1.25rem]">{orderNo}</p>
          </div>
          <div className="flex flex-col gap-[0.5rem] items-center">
            {loggedIn ? (
              <Link href="/orders" className="inline-flex items-center justify-center w-full max-w-[280px] py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft">
                View My Orders
              </Link>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                Sign in to track your order history
              </p>
            )}
            <Link href="/" className={loggedIn ? 'text-[0.8125rem] text-gold-dark no-underline transition-colors duration-[200ms] hover:text-gold' : 'inline-flex items-center justify-center w-full max-w-[280px] py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft'}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-charcoal text-white/60 mt-auto">
        <div className="max-w-[1280px] mx-auto py-[4rem] px-[2rem] max-sm:py-[3rem] max-sm:px-[1rem]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[3rem] pb-[3rem] border-b border-white/[0.08] max-md:grid-cols-2 max-md:gap-[2rem] max-sm:grid-cols-1 max-sm:gap-[1.5rem]">
            <div className="flex flex-col gap-[1rem]">
              <div className="font-display text-[1.75rem] font-semibold text-gold tracking-[-0.03em]">Vibe</div>
              <p className="text-[0.875rem] leading-[1.6] max-w-[280px]">
                A curated marketplace where every product tells a story and every interaction feels personal.
              </p>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Shop</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">All Products</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">New Arrivals</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Best Sellers</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Sale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Support</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Help Center</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Shipping Info</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Returns</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Company</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">About Us</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Careers</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Privacy Policy</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between pt-[2rem] text-[0.75rem] max-sm:flex-col max-sm:gap-[0.5rem] max-sm:text-center">
            <span>&copy; 2026 Vibe. All rights reserved.</span>
            <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-white/35">
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
