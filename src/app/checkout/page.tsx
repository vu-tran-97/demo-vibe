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
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* ── Header ── */}
      <header className="sticky top-0 z-100 bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto py-[0.75rem] px-[2rem] flex items-center justify-between max-sm:px-[1rem]">
          <div className="flex items-center gap-[2rem]">
            <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] no-underline">Vibe</Link>
            <nav className="flex items-center gap-[0.5rem] text-[0.8125rem] text-muted max-sm:hidden">
              <Link href="/" className="text-slate no-underline transition-colors duration-[200ms] hover:text-gold-dark">Home</Link>
              <span className="opacity-40">/</span>
              <Link href="/cart" className="text-slate no-underline transition-colors duration-[200ms] hover:text-gold-dark">Cart</Link>
              <span className="opacity-40">/</span>
              <span className="text-charcoal font-medium">Checkout</span>
            </nav>
          </div>
          <div className="flex items-center gap-[1rem] ml-auto shrink-0">
            {loggedIn && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <button
                type="button"
                className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border border-charcoal rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-charcoal-light hover:border-charcoal-light hover:text-white"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto py-[3rem] px-[2rem] max-sm:py-[1.5rem] max-sm:px-[1rem]">
        {items.length === 0 ? (
          <div className="text-center py-[8rem] px-[2rem]">
            <div className="text-[4rem] mb-[1.5rem] opacity-20">&#9744;</div>
            <h2 className="font-display text-[1.75rem] text-charcoal mb-[0.5rem]">Your cart is empty</h2>
            <p className="text-[0.9375rem] text-muted mb-[2rem]">Add some items to your cart before checking out.</p>
            <Link href="/cart" className="inline-flex items-center py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft">Go to Cart</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-[3rem]">
            <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
              <div>
                <h2 className="font-display text-[2.25rem] font-normal text-charcoal">Checkout</h2>
                <p className="text-[0.8125rem] text-muted mt-[2px]">{totalItems} item{totalItems !== 1 ? 's' : ''} in your order</p>
              </div>
              <Link href="/cart" className="text-[0.8125rem] text-gold-dark no-underline transition-colors duration-[200ms] hover:text-gold">Back to Cart</Link>
            </div>

            <div className="grid grid-cols-[1fr_420px] gap-[3rem] items-start max-md:grid-cols-1">
              {/* Order Summary */}
              <div className="flex flex-col gap-[1rem]">
                <h3 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em] mb-[0.5rem]">Order Summary</h3>
                {items.map((item) => {
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <div key={item.product.id} className="flex items-center gap-[1.5rem] py-[1rem] px-[1.5rem] bg-white border border-border-light rounded-[12px] max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem] max-sm:p-[1rem]">
                      <div className="w-[64px] h-[64px] rounded-[8px] bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] shrink-0 overflow-hidden relative max-sm:w-full max-sm:h-[120px]">
                        {item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover absolute inset-0" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.875rem] font-medium text-charcoal whitespace-nowrap overflow-hidden text-ellipsis">{item.product.name}</p>
                        <p className="text-[0.75rem] text-muted mt-[2px]">Qty: {item.quantity} &times; {formatPrice(price)}</p>
                      </div>
                      <span className="text-[0.9375rem] font-medium text-charcoal shrink-0">{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
                <div className="bg-white border border-border-light rounded-[12px] py-[1.5rem] px-[2rem] mt-[1rem]">
                  <div className="flex justify-between items-center py-[0.25rem] text-[0.875rem]">
                    <span className="text-slate">Subtotal ({totalItems} items)</span>
                    <span className="font-medium text-charcoal">{formatPrice(totalPrice + totalSavings)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center py-[0.25rem] text-[0.875rem]">
                      <span className="text-slate">Discount</span>
                      <span className="font-medium text-charcoal">&minus;{formatPrice(totalSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-[0.25rem] text-[0.875rem]">
                    <span className="text-slate">Shipping</span>
                    <span className="font-medium text-charcoal">Free</span>
                  </div>
                  <div className="h-[1px] bg-border-light my-[0.5rem]" />
                  <div className="flex justify-between items-center py-[0.25rem]">
                    <span className="text-[1rem] font-medium text-charcoal">Total</span>
                    <span className="font-display text-[1.375rem] font-medium text-charcoal">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping */}
              <div className="bg-white border border-border-light rounded-[12px] p-[2rem] sticky top-[calc(72px+2rem)] max-md:static">
                <h3 className="font-display text-[1.25rem] font-medium text-charcoal mb-[1.5rem] pb-[1rem] border-b border-border-light">Payment Method</h3>
                <div className="flex flex-col gap-[0.5rem] mb-[2rem]">
                  <div className={`flex items-start gap-[1rem] p-[1.5rem] border-2 rounded-[12px] cursor-pointer transition-all duration-[200ms] max-sm:p-[1rem] ${paymentMethod === 'BANK_TRANSFER' ? 'border-charcoal bg-white' : 'bg-ivory border-transparent hover:border-border'}`} onClick={() => setPaymentMethod('BANK_TRANSFER')}>
                    <div className={`w-[20px] h-[20px] border-2 rounded-full shrink-0 mt-[2px] flex items-center justify-center transition-all duration-[200ms] ${paymentMethod === 'BANK_TRANSFER' ? 'border-charcoal' : 'border-border'}`}>
                      {paymentMethod === 'BANK_TRANSFER' && <div className="w-[10px] h-[10px] bg-charcoal rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.9375rem] font-medium text-charcoal mb-[4px]">Bank Transfer</p>
                      <p className="text-[0.8125rem] text-muted leading-[1.5]">Transfer to our bank account using the QR code or account details below.</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-[1rem] p-[1.5rem] border-2 rounded-[12px] cursor-pointer transition-all duration-[200ms] max-sm:p-[1rem] ${paymentMethod === 'EMAIL_INVOICE' ? 'border-charcoal bg-white' : 'bg-ivory border-transparent hover:border-border'}`} onClick={() => setPaymentMethod('EMAIL_INVOICE')}>
                    <div className={`w-[20px] h-[20px] border-2 rounded-full shrink-0 mt-[2px] flex items-center justify-center transition-all duration-[200ms] ${paymentMethod === 'EMAIL_INVOICE' ? 'border-charcoal' : 'border-border'}`}>
                      {paymentMethod === 'EMAIL_INVOICE' && <div className="w-[10px] h-[10px] bg-charcoal rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[0.9375rem] font-medium text-charcoal mb-[4px]">Email Invoice</p>
                      <p className="text-[0.8125rem] text-muted leading-[1.5]">We will send an invoice with order details to your registered email.</p>
                    </div>
                  </div>
                </div>

                <div className="p-[1.5rem] bg-ivory rounded-[12px] mb-[2rem]">
                  {paymentMethod === 'BANK_TRANSFER' ? (
                    <div className="flex flex-col items-center gap-[1rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=demo-vibe-payment" alt="Payment QR Code" width={200} height={200} className="rounded-[8px] border border-border-light" />
                      <div className="text-center text-[0.8125rem] text-slate leading-[1.7]">
                        <span className="font-semibold text-charcoal block">Demo Vibe Commerce Inc.</span>
                        Bank: Kookmin Bank<br />
                        Account: 123-456-789012<br />
                        Amount: {formatPrice(totalPrice)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-[0.875rem] text-slate leading-[1.6] p-[1rem]">
                      <span className="text-[2rem] mb-[0.5rem] opacity-40 block">&#9993;</span>
                      Invoice will be sent to your registered email address after order confirmation.
                    </div>
                  )}
                </div>

                <h4 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em] mb-[0.5rem]">Shipping Information</h4>
                <div className="flex flex-col gap-[1rem] mb-[2rem]">
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="chkRcvrNm">Receiver Name</label>
                    <input id="chkRcvrNm" type="text" className="py-[0.625rem] px-[0.875rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-colors duration-[200ms] focus:border-gold placeholder:text-muted" value={shipRcvrNm} onChange={(e) => setShipRcvrNm(e.target.value)} placeholder="Full name of the receiver" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="chkTelno">Phone Number</label>
                    <input id="chkTelno" type="tel" className="py-[0.625rem] px-[0.875rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-colors duration-[200ms] focus:border-gold placeholder:text-muted" value={shipTelno} onChange={(e) => setShipTelno(e.target.value)} placeholder="e.g. 010-1234-5678" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="chkAddr">Shipping Address</label>
                    <input id="chkAddr" type="text" className="py-[0.625rem] px-[0.875rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-colors duration-[200ms] focus:border-gold placeholder:text-muted" value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} placeholder="Full shipping address" />
                  </div>
                  <div className="flex flex-col gap-[6px]">
                    <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="chkMemo">Delivery Memo</label>
                    <textarea id="chkMemo" className="py-[0.625rem] px-[0.875rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none resize-y transition-colors duration-[200ms] focus:border-gold placeholder:text-muted" value={shipMemo} onChange={(e) => setShipMemo(e.target.value)} placeholder="e.g. Leave at the front door" rows={2} />
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

                {error && <p className="text-[0.8125rem] text-error py-[0.5rem] px-[1rem] bg-[rgba(200,80,80,0.06)] rounded-[8px] mb-[1rem]">{error}</p>}

                <button type="button" className="w-full py-[0.875rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-[2px] hover:not-disabled:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting} onClick={handleConfirm}>
                  {submitting ? 'Processing...' : `Confirm Order — ${formatPrice(totalPrice)}`}
                </button>
              </div>
            </div>
          </div>
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
