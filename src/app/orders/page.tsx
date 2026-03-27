'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import {
  fetchBuyerOrders,
  fetchOrderById,
  updateOrderStatus,
  type Order,
  type OrderStatus,
  type OrderListResponse,
} from '@/lib/orders';
import { formatPrice } from '@/utils/format';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Status filters moved inline to the JSX

export default function MyOrdersPage() {
  const router = useRouter();
  const { totalItems: cartCount } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    setUser(getUser());
    if (!li) {
      router.replace('/');
    }
  }, [router]);

  function refreshAuth() {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }

  async function handleLogout() {
    await authLogout();
    setLoggedIn(false);
    setUser(null);
    router.replace('/');
  }

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (fulfillmentFilter !== 'ALL') params.itemStatus = fulfillmentFilter;
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data: OrderListResponse = await fetchBuyerOrders(params);
      setOrders(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, fulfillmentFilter, paymentFilter, startDate, endDate]);

  useEffect(() => {
    if (loggedIn) loadOrders();
  }, [loggedIn, loadOrders]);

  useEffect(() => { setPage(1); }, [fulfillmentFilter, paymentFilter, startDate, endDate]);

  async function handleOpenDetail(orderId: string) {
    setDetailLoading(true);
    setSelectedItemIdx(0);
    try {
      const detail = await fetchOrderById(orderId);
      setSelectedOrder(detail);
    } catch {
      setSelectedOrder(orders.find((o) => o.id === orderId) || null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await updateOrderStatus(orderId, 'CANCELLED');
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  }

  function getStatusClass(status: OrderStatus) {
    switch (status) {
      case 'PENDING': return 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]';
      case 'PAID': return 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]';
      case 'CONFIRMED': return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
      case 'SHIPPED': return 'text-gold-dark bg-[rgba(200,169,110,0.12)]';
      case 'DELIVERED': return 'text-success bg-[rgba(90,138,106,0.08)]';
      case 'CANCELLED': return 'text-error bg-[rgba(200,80,80,0.08)]';
      default: return '';
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
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
              <span className="text-charcoal font-medium">My Orders</span>
            </nav>
          </div>
          <div className="flex items-center gap-[1rem] ml-auto shrink-0">
            {loggedIn && user ? (
              <>
                <Link href="/cart" className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-slate bg-none border border-border rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:text-charcoal hover:border-charcoal">
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
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
        <div className="flex flex-col gap-[2rem]">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-[2.25rem] font-normal">Purchase History</h1>
              <p className="text-[0.8125rem] text-muted mt-[2px]">
                {loading ? 'Loading...' : `${totalCount} order${totalCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Fulfillment Filter */}
          <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] overflow-x-auto [-webkit-overflow-scrolling:touch] max-sm:p-[2px]">
            {(['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
              const labels: Record<string, string> = { ALL: 'All', PENDING: 'Processing', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };
              return (
                <button key={s} type="button" className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:text-charcoal max-sm:py-[0.375rem] max-sm:px-[0.75rem] max-sm:text-[0.75rem] ${fulfillmentFilter === s ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`} onClick={() => setFulfillmentFilter(s)}>
                  {labels[s]}
                </button>
              );
            })}
          </div>

          {/* Payment Filter + Date */}
          <div className="flex items-end gap-[1rem] flex-wrap">
            <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] overflow-x-auto [-webkit-overflow-scrolling:touch] flex-1">
              {(['ALL', 'UNPAID', 'PAID'] as const).map((s) => {
                const labels: Record<string, string> = { ALL: 'All Payments', UNPAID: 'Unpaid', PAID: 'Paid' };
                return (
                  <button key={s} type="button" className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:text-charcoal ${paymentFilter === s ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`} onClick={() => setPaymentFilter(s)}>
                    {labels[s]}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="startDate">From</label>
              <input id="startDate" type="date" className="py-[0.5rem] px-[0.75rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-colors duration-[200ms] focus:border-gold" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="endDate">To</label>
              <input id="endDate" type="date" className="py-[0.5rem] px-[0.75rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-colors duration-[200ms] focus:border-gold" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {(startDate || endDate || fulfillmentFilter !== 'ALL' || paymentFilter !== 'ALL') && (
              <button type="button" className="py-[0.5rem] px-[0.75rem] font-body text-[0.75rem] text-error bg-transparent border-none cursor-pointer transition-opacity duration-[200ms] hover:opacity-70" onClick={() => { setStartDate(''); setEndDate(''); setFulfillmentFilter('ALL'); setPaymentFilter('ALL'); }}>
                Clear all
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-[3rem] px-[2rem] text-error text-[0.875rem]">
              <p>{error}</p>
              <button type="button" className="mt-[1rem] py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal" onClick={loadOrders}>Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]">
              <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
              <p>Loading orders...</p>
            </div>
          )}

          {/* Order List */}
          {!loading && !error && (
            <div className="flex flex-col gap-[0.5rem]">
              {orders.length === 0 ? (
                <div className="text-center py-[6rem] px-[2rem]">
                  <div className="text-border mb-[1.5rem]">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                  <h3 className="font-display text-[1.25rem] text-charcoal mb-[0.5rem]">No orders found</h3>
                  <p className="text-[0.875rem] text-muted">Orders matching this filter will appear here.</p>
                </div>
              ) : (
                orders.map((order, i) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`flex flex-col gap-[1rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px] cursor-pointer text-left w-full transition-all duration-[200ms] hover:border-border hover:shadow-soft hover:-translate-y-[1px] max-sm:py-[1rem] max-sm:px-[1.5rem] animate-fade-up delay-${Math.min(i + 1, 8)}`}
                    onClick={() => handleOpenDetail(order.id)}
                  >
                    <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
                      <div className="flex items-center gap-[1rem]">
                        <span className="font-body text-[0.875rem] font-medium text-charcoal">{order.orderNo}</span>
                        <span className="text-[0.75rem] text-muted">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-[6px] shrink-0">
                        {order.items.length === 1 && (
                          <>
                            <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${order.items[0].paymentStatus === 'PAID' ? 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]' : order.status === 'CANCELLED' ? 'text-error bg-[rgba(200,80,80,0.08)]' : 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]'}`}>
                              {order.items[0].paymentStatus === 'PAID' ? 'Paid' : order.status === 'CANCELLED' ? 'Cancelled' : 'Unpaid'}
                            </span>
                            {order.status !== 'CANCELLED' && (() => {
                              const fl: Record<string, string> = { PENDING: 'Processing', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' };
                              return (
                                <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClass(order.items[0].itemStatus as OrderStatus)}`}>
                                  {fl[order.items[0].itemStatus] || order.items[0].itemStatus}
                                </span>
                              );
                            })()}
                          </>
                        )}
                        {order.items.length > 1 && (
                          <span className="text-[0.75rem] text-muted">{order.items.length} items</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[0.5rem]">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-[1rem]">
                          <span className="text-[1.5rem] w-[40px] h-[40px] flex items-center justify-center bg-ivory rounded-[8px] shrink-0">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-[8px]" />
                            ) : '📦'}
                          </span>
                          <div className="flex-1 flex flex-col gap-[2px]">
                            <span className="text-[0.8125rem] font-medium text-charcoal">{item.productName}</span>
                            <span className="text-[0.75rem] text-muted">Qty: {item.quantity}</span>
                          </div>
                          {order.items.length > 1 && (
                            <div className="flex items-center gap-[6px] shrink-0">
                              <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${item.paymentStatus === 'PAID' ? 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]' : 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]'}`}>
                                {item.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                              </span>
                              <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClass(item.itemStatus as OrderStatus)}`}>
                                {item.itemStatus === 'PENDING' ? 'Processing' : item.itemStatus === 'CONFIRMED' ? 'Confirmed' : item.itemStatus === 'SHIPPED' ? 'Shipped' : item.itemStatus === 'DELIVERED' ? 'Delivered' : item.itemStatus}
                              </span>
                            </div>
                          )}
                          <span className="text-[0.875rem] font-medium text-charcoal">{formatPrice(item.subtotalAmount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-[0.5rem] border-t border-border-light">
                      <div className="flex items-center gap-[0.5rem]">
                        <span className="text-[0.8125rem] text-slate">Total</span>
                        <span className="font-display text-[1.125rem] font-normal text-charcoal">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-[1.5rem]">
              <button type="button" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-35 disabled:cursor-not-allowed" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-[0.8125rem] text-slate">Page {page} of {totalPages}</span>
              <button type="button" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-35 disabled:cursor-not-allowed" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}

          {/* Order Detail Modal */}
          {(selectedOrder || detailLoading) && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[4px] flex items-center justify-center z-100 animate-fade-in p-[2rem]" onClick={() => !detailLoading && setSelectedOrder(null)}>
              <div className="bg-white rounded-[16px] w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-[2rem] animate-scale-in shadow-elevated max-sm:max-w-full max-sm:m-[1rem]" onClick={(e) => e.stopPropagation()}>
                {detailLoading ? (
                  <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]"><div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" /><p>Loading order details...</p></div>
                ) : selectedOrder ? (
                  <>
                    <div className="flex items-start justify-between mb-[1.5rem]">
                      <div>
                        <h2 className="font-display text-[1.375rem] font-normal text-charcoal">Order Details</h2>
                        <p className="text-[0.8125rem] text-muted mt-[2px]">{selectedOrder.orderNo}</p>
                      </div>
                      <button type="button" className="w-[32px] h-[32px] flex items-center justify-center bg-ivory border-none rounded-[8px] cursor-pointer text-slate text-[0.875rem] transition-all duration-[200ms] hover:bg-ivory-warm hover:text-charcoal" onClick={() => setSelectedOrder(null)}>&#x2715;</button>
                    </div>
                    <div className="flex items-center gap-[1rem] mb-[2rem]">
                      <span className="text-[0.8125rem] text-muted">Ordered on {formatDate(selectedOrder.createdAt)}</span>
                    </div>

                    {/* Item Tabs — only show if multiple items */}
                    {selectedOrder.items.length > 1 && (
                      <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] mb-[1.5rem] overflow-x-auto [-webkit-overflow-scrolling:touch]">
                        {selectedOrder.items.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`flex items-center gap-[0.5rem] py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:text-charcoal ${selectedItemIdx === idx ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`}
                            onClick={() => setSelectedItemIdx(idx)}
                          >
                            <span className="w-[24px] h-[24px] rounded-[4px] overflow-hidden shrink-0 bg-ivory flex items-center justify-center text-[0.75rem]">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-[8px]" />
                              ) : '📦'}
                            </span>
                            <span className="max-w-[120px] overflow-hidden text-ellipsis">{item.productName}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Item Detail */}
                    {(() => {
                      const ITEM_LABELS: Record<string, string> = { PENDING: 'Processing', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' };
                      const item = selectedOrder.items[selectedItemIdx] || selectedOrder.items[0];
                      if (!item) return null;
                      const itemSteps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;
                      const itemIdx = itemSteps.indexOf(item.itemStatus as typeof itemSteps[number]);

                      return (
                        <div className="mb-[2rem] p-[1rem] bg-ivory rounded-[12px]">
                          {/* Item info */}
                          <div className="flex items-center gap-[1rem] pb-[1rem]">
                            <span className="text-[1.75rem] w-[48px] h-[48px] flex items-center justify-center bg-ivory rounded-[8px]">
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover rounded-[8px]" />
                              ) : '📦'}
                            </span>
                            <div className="flex-1 flex flex-col gap-[2px]">
                              <span className="text-[0.875rem] font-medium text-charcoal">{item.productName}</span>
                              <span className="text-[0.75rem] text-muted">
                                Qty: {item.quantity} x {formatPrice(item.unitPrice)}
                                {item.sellerName && ` — ${item.sellerName}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-[6px] shrink-0">
                              <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${item.paymentStatus === 'PAID' ? 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]' : 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]'}`}>
                                {item.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                              </span>
                              <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClass(item.itemStatus as OrderStatus)}`}>
                                {ITEM_LABELS[item.itemStatus] || item.itemStatus}
                              </span>
                            </div>
                            <span className="text-[0.9375rem] font-medium text-charcoal">{formatPrice(item.subtotalAmount)}</span>
                          </div>

                          {/* Per-item progress bar */}
                          {selectedOrder.status !== 'CANCELLED' && (
                            <div className="flex items-start justify-between mb-[1rem] p-[1.5rem] bg-ivory rounded-[12px] relative before:content-[''] before:absolute before:top-[calc(1.5rem+8px)] before:left-[calc(1.5rem+8px)] before:right-[calc(1.5rem+8px)] before:h-[2px] before:bg-border max-sm:p-[1rem]">
                              {itemSteps.map((step, idx) => (
                                <div key={step} className={`flex flex-col items-center gap-[0.5rem] relative z-1 ${idx <= itemIdx ? '[&>.step-dot]:bg-charcoal [&>.step-dot]:border-charcoal [&>.step-label]:text-charcoal [&>.step-label]:font-medium' : ''} ${idx === itemIdx ? '[&>.step-dot]:border-gold [&>.step-dot]:bg-gold [&>.step-dot]:shadow-[0_0_0_4px_rgba(200,169,110,0.2)]' : ''}`}>
                                  <div className="step-dot w-[18px] h-[18px] rounded-full bg-white border-2 border-border transition-all duration-[200ms]" />
                                  <span className="step-label text-[0.6875rem] text-muted whitespace-nowrap max-sm:text-[0.5625rem]">{ITEM_LABELS[step]}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tracking number */}
                          {item.trackingNumber && (
                            <div className="flex items-center gap-[0.5rem] py-[0.5rem] px-[1rem] bg-white rounded-[8px] text-[0.8125rem]">
                              <span className="text-slate font-medium">Tracking:</span>
                              <span className="text-charcoal font-body font-semibold tracking-[0.02em]">{item.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Status History */}
                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                      <div className="mb-[2rem]">
                        <h3 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em] mb-[1rem]">Status History</h3>
                        {selectedOrder.statusHistory.map((entry) => (
                          <div key={entry.id} className="flex gap-[1rem] py-[0.5rem] [&+&]:border-t [&+&]:border-border-light">
                            <div className="w-[10px] h-[10px] rounded-full bg-charcoal mt-[4px] shrink-0" />
                            <div className="flex flex-wrap items-center gap-[0.5rem]">
                              <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClass(entry.newStatus as OrderStatus)}`}>
                                {STATUS_LABELS[entry.newStatus as OrderStatus] || entry.newStatus}
                              </span>
                              <span className="text-[0.75rem] text-muted">{formatDate(entry.changedAt)}</span>
                              {entry.reason && <p className="w-full text-[0.75rem] text-slate mt-[2px]">{entry.reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-col gap-[0.5rem] p-[1.5rem] bg-ivory rounded-[12px] mb-[1.5rem]">
                      {selectedOrder.shippingAddress && <div className="flex items-center justify-between text-[0.8125rem] text-slate"><span>Shipping Address</span><span>{selectedOrder.shippingAddress}</span></div>}
                      {selectedOrder.receiverName && <div className="flex items-center justify-between text-[0.8125rem] text-slate"><span>Receiver</span><span>{selectedOrder.receiverName}</span></div>}
                      {selectedOrder.receiverPhone && <div className="flex items-center justify-between text-[0.8125rem] text-slate"><span>Phone</span><span>{selectedOrder.receiverPhone}</span></div>}
                      {selectedOrder.shippingMemo && <div className="flex items-center justify-between text-[0.8125rem] text-slate"><span>Memo</span><span>{selectedOrder.shippingMemo}</span></div>}
                      <div className="flex items-center justify-between text-[0.9375rem] font-medium text-charcoal pt-[0.5rem] border-t border-border-light">
                        <span>Total</span><span>{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                    <div className="flex gap-[0.5rem] justify-end max-sm:flex-col">
                      {selectedOrder.status === 'PENDING' && (
                        <button type="button" className="py-[0.625rem] px-[1.25rem] font-body text-[0.8125rem] font-medium rounded-[8px] cursor-pointer transition-all duration-[200ms] bg-transparent text-error border border-[rgba(200,80,80,0.3)] hover:bg-[rgba(200,80,80,0.06)] hover:border-error" disabled={cancelling} onClick={() => handleCancelOrder(selectedOrder.id)}>
                          {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button type="button" className="py-[0.625rem] px-[1.25rem] font-body text-[0.8125rem] font-medium rounded-[8px] cursor-pointer transition-all duration-[200ms] bg-transparent text-slate border border-border hover:border-charcoal hover:text-charcoal" onClick={() => setSelectedOrder(null)}>Close</button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
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
