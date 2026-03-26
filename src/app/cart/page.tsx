'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/products';
import { showToast, ToastContainer } from '@/components/toast/Toast';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';

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
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* ── Header ── */}
      <header className="sticky top-0 z-100 bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto py-[0.75rem] px-[2rem] flex items-center justify-between max-sm:px-[1rem]">
          <div className="flex items-center gap-[2rem]">
            <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] no-underline">Vibe</Link>
            <nav className="flex items-center gap-[0.5rem] text-[0.8125rem] text-muted max-sm:hidden">
              <Link href="/" className="text-slate no-underline transition-colors duration-[200ms] hover:text-gold-dark">Home</Link>
              <span className="opacity-40">/</span>
              <span className="text-charcoal font-medium">Shopping Cart</span>
            </nav>
          </div>
          <div className="flex items-center gap-[1rem] ml-auto shrink-0">
            {loggedIn && user ? (
              <>
                <Link href="/orders" className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-slate bg-none border border-border rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:text-charcoal hover:border-charcoal">My Orders</Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border border-charcoal rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:border-charcoal-light hover:text-white"
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
      <main className="flex-1 max-w-[1280px] w-full mx-auto py-[3rem] px-[2rem] max-sm:py-[1.5rem] max-sm:px-[1rem]">
        {items.length === 0 ? (
          <div className="text-center py-[8rem] px-[2rem] max-w-[480px] mx-auto">
            <div className="w-[100px] h-[100px] mx-auto mb-[2rem] flex items-center justify-center bg-white border-2 border-dashed border-border rounded-full">
              <svg className="text-muted opacity-40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h2 className="font-display text-[2rem] font-normal text-charcoal mb-[0.5rem]">Your cart is empty</h2>
            <p className="text-[0.9375rem] text-muted leading-[1.6] mb-[2rem]">
              Discover our curated collection of unique products and find something you love.
            </p>
            <Link href="/" className="inline-flex items-center gap-[0.5rem] py-[0.875rem] px-[2rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="flex items-end justify-between mb-[3rem] pb-[1.5rem] border-b border-border-light max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
              <div>
                <h1 className="font-display text-[2.25rem] font-normal text-charcoal leading-[1.2] max-sm:text-[1.75rem]">Shopping Cart</h1>
                <p className="text-[0.9375rem] text-muted mt-[0.25rem]">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
                </p>
              </div>
              <button
                type="button"
                className="font-body text-[0.8125rem] text-muted bg-none border border-border rounded-[8px] py-[0.5rem] px-[1rem] cursor-pointer transition-all duration-[200ms] hover:text-error hover:border-error"
                onClick={() => { clearCart(); showToast('Cart cleared'); }}
              >
                Clear all
              </button>
            </div>

            {/* Cart Grid */}
            <div className="grid grid-cols-[1fr_400px] gap-[3rem] items-start max-md:grid-cols-1">
              {/* Items */}
              <div className="flex flex-col gap-[1rem]">
                {items.map((item) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={item.product.id} className="flex gap-[1.5rem] p-[1.5rem] bg-white border border-border-light rounded-[12px] transition-all duration-[200ms] hover:border-border hover:shadow-subtle max-sm:flex-col max-sm:gap-[1rem]">
                      <div className="w-[120px] h-[120px] rounded-[8px] bg-[linear-gradient(145deg,#F5F3EE_0%,#E8E4DE_50%,#D4CFC6_100%)] shrink-0 overflow-hidden relative max-sm:w-full max-sm:h-[200px]">
                        {item.product.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-[1rem]">
                          <div>
                            <h3 className="font-display text-[1.25rem] font-medium text-charcoal leading-[1.3] m-0">
                              <Link
                                href={`/products/${item.product.id}`}
                                className="text-inherit no-underline transition-colors duration-[200ms] hover:text-gold-dark"
                              >
                                {item.product.name}
                              </Link>
                            </h3>
                            <p className="text-[0.8125rem] text-muted mt-[4px]">
                              by {item.product.seller.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="w-[32px] h-[32px] flex items-center justify-center text-[0.875rem] text-muted bg-ivory border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] shrink-0 hover:text-error hover:bg-[rgba(200,80,80,0.06)]"
                            onClick={() => {
                              removeItem(item.product.id);
                              showToast(`Removed "${item.product.name}" from cart`);
                            }}
                          >
                            &#x2715;
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-[1rem]">
                          <div className="flex items-center border border-border rounded-[8px] overflow-hidden">
                            <button
                              type="button"
                              className="w-[36px] h-[36px] flex items-center justify-center text-[1rem] text-slate bg-white border-none cursor-pointer transition-all duration-[200ms] hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              &minus;
                            </button>
                            <span className="w-[40px] text-center text-[0.875rem] font-semibold text-charcoal border-l border-r border-border-light leading-[36px]">{item.quantity}</span>
                            <button
                              type="button"
                              className="w-[36px] h-[36px] flex items-center justify-center text-[1rem] text-slate bg-white border-none cursor-pointer transition-all duration-[200ms] hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <span className="font-display text-[1.125rem] font-medium text-charcoal">
                              {formatPrice(price * item.quantity)}
                            </span>
                            {item.product.salePrice !== null && (
                              <span className="block text-[0.75rem] text-muted line-through mt-[2px]">
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
              <div className="bg-white border border-border-light rounded-[16px] p-[2rem] sticky top-[calc(72px+3rem)] max-md:static">
                <h3 className="font-display text-[1.375rem] font-medium text-charcoal mb-[1.5rem] pb-[1rem] border-b border-border-light">Order Summary</h3>

                <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
                  <span className="text-slate">
                    Subtotal ({totalItems} items)
                  </span>
                  <span className="font-medium text-charcoal">
                    {formatPrice(totalPrice + totalSavings)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
                    <span className="text-slate">Discount</span>
                    <span className="font-medium text-success">
                      &minus;{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-[0.5rem] text-[0.875rem]">
                  <span className="text-slate">Shipping</span>
                  <span className="inline-flex items-center gap-[4px] text-[0.75rem] text-success font-medium">Free</span>
                </div>

                <div className="h-[1px] bg-border-light my-[1rem]" />

                <div className="flex justify-between items-center py-[1rem]">
                  <span className="text-[1rem] font-medium text-charcoal">Total</span>
                  <span className="font-display text-[1.75rem] font-medium text-charcoal">{formatPrice(totalPrice)}</span>
                </div>

                <Link href="/checkout" className="flex items-center justify-center gap-[0.5rem] w-full p-[1rem] mt-[1.5rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-medium">
                  <span className="text-[1.125rem]">&#x2192;</span>
                  Proceed to Checkout
                </Link>

                <Link href="/" className="block text-center mt-[1rem] text-[0.8125rem] text-gold-dark no-underline transition-colors duration-[200ms] hover:text-gold">
                  Continue Shopping
                </Link>

                <div className="flex flex-col gap-[0.5rem] mt-[1.5rem] pt-[1.5rem] border-t border-border-light">
                  <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-muted">
                    <span className="text-[0.875rem] shrink-0">&#x2713;</span>
                    Free shipping on all orders
                  </div>
                  <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-muted">
                    <span className="text-[0.875rem] shrink-0">&#x21BA;</span>
                    30-day hassle-free returns
                  </div>
                  <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-muted">
                    <span className="text-[0.875rem] shrink-0">&#x26A1;</span>
                    Secure checkout with encryption
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
