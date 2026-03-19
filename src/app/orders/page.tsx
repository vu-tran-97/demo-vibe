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
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';
import layout from '@/app/cart/cart-page.module.css';
import styles from '@/app/dashboard/orders/orders.module.css';

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
      case 'PENDING': return styles.statusPending;
      case 'PAID': return styles.statusPaid;
      case 'CONFIRMED': return styles.statusConfirmed;
      case 'SHIPPED': return styles.statusShipped;
      case 'DELIVERED': return styles.statusDelivered;
      case 'CANCELLED': return styles.statusCancelled;
      default: return '';
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
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
              <span className={layout.breadcrumbCurrent}>My Orders</span>
            </nav>
          </div>
          <div className={layout.headerRight}>
            {loggedIn && user ? (
              <>
                <Link href="/cart" className={layout.headerBtn}>
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
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
        <div className={styles.orders}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle} style={{ fontSize: '2.25rem' }}>Purchase History</h1>
              <p className={styles.pageSubtitle}>
                {loading ? 'Loading...' : `${totalCount} order${totalCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Fulfillment Filter */}
          <div className={styles.statusTabs}>
            {(['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
              const labels: Record<string, string> = { ALL: 'All', PENDING: 'Processing', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };
              return (
                <button key={s} type="button" className={`${styles.tab} ${fulfillmentFilter === s ? styles.tabActive : ''}`} onClick={() => setFulfillmentFilter(s)}>
                  {labels[s]}
                </button>
              );
            })}
          </div>

          {/* Payment Filter + Date */}
          <div className={styles.dateFilters}>
            <div className={styles.statusTabs} style={{ flex: 1 }}>
              {(['ALL', 'UNPAID', 'PAID'] as const).map((s) => {
                const labels: Record<string, string> = { ALL: 'All Payments', UNPAID: 'Unpaid', PAID: 'Paid' };
                return (
                  <button key={s} type="button" className={`${styles.tab} ${paymentFilter === s ? styles.tabActive : ''}`} onClick={() => setPaymentFilter(s)}>
                    {labels[s]}
                  </button>
                );
              })}
            </div>
            <div className={styles.dateField}>
              <label className={styles.dateLabel} htmlFor="startDate">From</label>
              <input id="startDate" type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.dateField}>
              <label className={styles.dateLabel} htmlFor="endDate">To</label>
              <input id="endDate" type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {(startDate || endDate || fulfillmentFilter !== 'ALL' || paymentFilter !== 'ALL') && (
              <button type="button" className={styles.clearDatesBtn} onClick={() => { setStartDate(''); setEndDate(''); setFulfillmentFilter('ALL'); setPaymentFilter('ALL'); }}>
                Clear all
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorState}>
              <p>{error}</p>
              <button type="button" className={styles.retryBtn} onClick={loadOrders}>Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading orders...</p>
            </div>
          )}

          {/* Order List */}
          {!loading && !error && (
            <div className={styles.orderList}>
              {orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                  <h3 className={styles.emptyTitle}>No orders found</h3>
                  <p className={styles.emptyDesc}>Orders matching this filter will appear here.</p>
                </div>
              ) : (
                orders.map((order, i) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`${styles.orderCard} animate-fade-up delay-${Math.min(i + 1, 8)}`}
                    onClick={() => handleOpenDetail(order.id)}
                  >
                    <div className={styles.orderTop}>
                      <div className={styles.orderMeta}>
                        <span className={styles.orderNumber}>{order.orderNo}</span>
                        <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className={styles.orderTags}>
                        {order.items.length === 1 && (
                          <>
                            <span className={`${styles.statusBadge} ${order.items[0].paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending}`}>
                              {order.items[0].paymentStatus === 'PAID' ? 'Paid' : order.status === 'CANCELLED' ? 'Cancelled' : 'Unpaid'}
                            </span>
                            {order.status !== 'CANCELLED' && (() => {
                              const fl: Record<string, string> = { PENDING: 'Processing', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' };
                              return (
                                <span className={`${styles.statusBadge} ${getStatusClass(order.items[0].itemStatus as OrderStatus)}`}>
                                  {fl[order.items[0].itemStatus] || order.items[0].itemStatus}
                                </span>
                              );
                            })()}
                          </>
                        )}
                        {order.items.length > 1 && (
                          <span className={styles.orderDate}>{order.items.length} items</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.orderItems}>
                      {order.items.map((item) => (
                        <div key={item.id} className={styles.orderItem}>
                          <span className={styles.itemEmoji}>
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName} className={styles.itemImage} />
                            ) : '📦'}
                          </span>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.productName}</span>
                            <span className={styles.itemQty}>Qty: {item.quantity}</span>
                          </div>
                          {order.items.length > 1 && (
                            <div className={styles.orderTags}>
                              <span className={`${styles.statusBadge} ${item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending}`}>
                                {item.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                              </span>
                              <span className={`${styles.statusBadge} ${getStatusClass(item.itemStatus as OrderStatus)}`}>
                                {item.itemStatus === 'PENDING' ? 'Processing' : item.itemStatus === 'CONFIRMED' ? 'Confirmed' : item.itemStatus === 'SHIPPED' ? 'Shipped' : item.itemStatus === 'DELIVERED' ? 'Delivered' : item.itemStatus}
                              </span>
                            </div>
                          )}
                          <span className={styles.itemPrice}>${item.subtotalAmount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.orderBottom}>
                      <div className={styles.orderTotal}>
                        <span className={styles.totalLabel}>Total</span>
                        <span className={styles.totalValue}>${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button type="button" className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}

          {/* Order Detail Modal */}
          {(selectedOrder || detailLoading) && (
            <div className={styles.modalOverlay} onClick={() => !detailLoading && setSelectedOrder(null)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {detailLoading ? (
                  <div className={styles.loadingState}><div className={styles.spinner} /><p>Loading order details...</p></div>
                ) : selectedOrder ? (
                  <>
                    <div className={styles.modalHeader}>
                      <div>
                        <h2 className={styles.modalTitle}>Order Details</h2>
                        <p className={styles.modalOrderNum}>{selectedOrder.orderNo}</p>
                      </div>
                      <button type="button" className={styles.modalClose} onClick={() => setSelectedOrder(null)}>&#x2715;</button>
                    </div>
                    <div className={styles.modalStatus}>
                      <span className={styles.modalDate}>Ordered on {formatDate(selectedOrder.createdAt)}</span>
                    </div>

                    {/* Item Tabs — only show if multiple items */}
                    {selectedOrder.items.length > 1 && (
                      <div className={styles.itemTabs}>
                        {selectedOrder.items.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`${styles.itemTab} ${selectedItemIdx === idx ? styles.itemTabActive : ''}`}
                            onClick={() => setSelectedItemIdx(idx)}
                          >
                            <span className={styles.itemTabImg}>
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt={item.productName} className={styles.itemImage} />
                              ) : '📦'}
                            </span>
                            <span className={styles.itemTabName}>{item.productName}</span>
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
                        <div className={styles.itemDetail}>
                          {/* Item info */}
                          <div className={styles.modalItem}>
                            <span className={styles.modalItemEmoji}>
                              {item.productImageUrl ? (
                                <img src={item.productImageUrl} alt={item.productName} className={styles.itemImage} />
                              ) : '📦'}
                            </span>
                            <div className={styles.modalItemInfo}>
                              <span className={styles.modalItemName}>{item.productName}</span>
                              <span className={styles.modalItemQty}>
                                Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}
                                {item.sellerName && ` — ${item.sellerName}`}
                              </span>
                            </div>
                            <div className={styles.orderTags}>
                              <span className={`${styles.statusBadge} ${item.paymentStatus === 'PAID' ? styles.statusPaid : styles.statusPending}`}>
                                {item.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                              </span>
                              <span className={`${styles.statusBadge} ${getStatusClass(item.itemStatus as OrderStatus)}`}>
                                {ITEM_LABELS[item.itemStatus] || item.itemStatus}
                              </span>
                            </div>
                            <span className={styles.modalItemPrice}>${item.subtotalAmount.toFixed(2)}</span>
                          </div>

                          {/* Per-item progress bar */}
                          {selectedOrder.status !== 'CANCELLED' && (
                            <div className={styles.progressBar}>
                              {itemSteps.map((step, idx) => (
                                <div key={step} className={`${styles.progressStep} ${idx <= itemIdx ? styles.stepCompleted : ''} ${idx === itemIdx ? styles.stepCurrent : ''}`}>
                                  <div className={styles.stepDot} />
                                  <span className={styles.stepLabel}>{ITEM_LABELS[step]}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Tracking number */}
                          {item.trackingNumber && (
                            <div className={styles.trackingInfo}>
                              <span className={styles.trackingLabel}>Tracking:</span>
                              <span className={styles.trackingValue}>{item.trackingNumber}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Status History */}
                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                      <div className={styles.statusTimeline}>
                        <h3 className={styles.modalSectionTitle}>Status History</h3>
                        {selectedOrder.statusHistory.map((entry) => (
                          <div key={entry.id} className={styles.timelineItem}>
                            <div className={styles.timelineDot} />
                            <div className={styles.timelineContent}>
                              <span className={`${styles.statusBadge} ${getStatusClass(entry.newStatus as OrderStatus)}`}>
                                {STATUS_LABELS[entry.newStatus as OrderStatus] || entry.newStatus}
                              </span>
                              <span className={styles.timelineDate}>{formatDate(entry.changedAt)}</span>
                              {entry.reason && <p className={styles.timelineReason}>{entry.reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.modalSummary}>
                      {selectedOrder.shippingAddress && <div className={styles.summaryRow}><span>Shipping Address</span><span>{selectedOrder.shippingAddress}</span></div>}
                      {selectedOrder.receiverName && <div className={styles.summaryRow}><span>Receiver</span><span>{selectedOrder.receiverName}</span></div>}
                      {selectedOrder.receiverPhone && <div className={styles.summaryRow}><span>Phone</span><span>{selectedOrder.receiverPhone}</span></div>}
                      {selectedOrder.shippingMemo && <div className={styles.summaryRow}><span>Memo</span><span>{selectedOrder.shippingMemo}</span></div>}
                      <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                        <span>Total</span><span>${selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.modalActions}>
                      {selectedOrder.status === 'PENDING' && (
                        <button type="button" className={styles.cancelOrderBtn} disabled={cancelling} onClick={() => handleCancelOrder(selectedOrder.id)}>
                          {cancelling ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <button type="button" className={styles.contactBtn} onClick={() => setSelectedOrder(null)}>Close</button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
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
