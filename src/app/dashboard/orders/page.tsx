'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  fetchBuyerOrders,
  fetchOrderById,
  updateOrderStatus,
  type Order,
  type OrderStatus,
  type OrderListResponse,
} from '@/lib/orders';
import styles from './orders.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export default function OrdersPage() {
  const { user } = useAuth(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Redirect sellers to the sales page
  const isSeller = user?.role === 'SELLER';

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data: OrderListResponse = await fetchBuyerOrders(params);
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (user && !isSeller) {
      loadOrders();
    }
  }, [user, isSeller, loadOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, startDate, endDate]);

  async function handleOpenDetail(orderId: string) {
    setDetailLoading(true);
    try {
      const detail = await fetchOrderById(orderId);
      setSelectedOrder(detail);
    } catch {
      // Fallback: use the list data
      const fallback = orders.find((o) => o.id === orderId) || null;
      setSelectedOrder(fallback);
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
      case 'PENDING':
        return styles.statusPending;
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'SHIPPED':
        return styles.statusShipped;
      case 'DELIVERED':
        return styles.statusDelivered;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return '';
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (isSeller) {
    return (
      <div className={styles.orders}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Orders</h2>
            <p className={styles.pageSubtitle}>
              As a seller, view your sales history.
            </p>
          </div>
        </div>
        <div className={styles.sellerRedirect}>
          <Link href="/dashboard/orders/sales" className={styles.sellerLink}>
            Go to Sales Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orders}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>My Orders</h2>
          <p className={styles.pageSubtitle}>
            {loading ? 'Loading...' : `${totalCount} order${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className={styles.statusTabs}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.tab} ${statusFilter === s ? styles.tabActive : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>

      {/* Date Range Filters */}
      <div className={styles.dateFilters}>
        <div className={styles.dateField}>
          <label className={styles.dateLabel} htmlFor="startDate">From</label>
          <input
            id="startDate"
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateField}>
          <label className={styles.dateLabel} htmlFor="endDate">To</label>
          <input
            id="endDate"
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            className={styles.clearDatesBtn}
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={loadOrders}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
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
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No orders found</h3>
              <p className={styles.emptyDesc}>
                Orders matching this filter will appear here.
              </p>
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
                    <span className={styles.orderNumber}>
                      {order.orderNumber}
                    </span>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(order.status)}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className={styles.orderItems}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.orderItem}>
                      <span className={styles.itemEmoji}>
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className={styles.itemImage}
                          />
                        ) : (
                          '📦'
                        )}
                      </span>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>
                          {item.productName}
                        </span>
                        <span className={styles.itemQty}>
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <span className={styles.itemPrice}>
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.orderBottom}>
                  <div className={styles.orderTotal}>
                    <span className={styles.totalLabel}>Total</span>
                    <span className={styles.totalValue}>
                      ${order.totalAmount.toFixed(2)}
                    </span>
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
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {(selectedOrder || detailLoading) && (
        <div
          className={styles.modalOverlay}
          onClick={() => !detailLoading && setSelectedOrder(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Loading order details...</p>
              </div>
            ) : selectedOrder ? (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <h2 className={styles.modalTitle}>Order Details</h2>
                    <p className={styles.modalOrderNum}>
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.modalClose}
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.modalStatus}>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(selectedOrder.status)}`}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                  <span className={styles.modalDate}>
                    Ordered on {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>

                {/* Progress bar for non-cancelled orders */}
                {selectedOrder.status !== 'CANCELLED' && (
                  <div className={styles.progressBar}>
                    {(
                      ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const
                    ).map((step, idx) => {
                      const steps = [
                        'PENDING',
                        'CONFIRMED',
                        'SHIPPED',
                        'DELIVERED',
                      ];
                      const currentIdx = steps.indexOf(selectedOrder.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div
                          key={step}
                          className={`${styles.progressStep} ${isCompleted ? styles.stepCompleted : ''} ${isCurrent ? styles.stepCurrent : ''}`}
                        >
                          <div className={styles.stepDot} />
                          <span className={styles.stepLabel}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Status History Timeline */}
                {selectedOrder.statusHistory &&
                  selectedOrder.statusHistory.length > 0 && (
                    <div className={styles.statusTimeline}>
                      <h3 className={styles.modalSectionTitle}>
                        Status History
                      </h3>
                      {selectedOrder.statusHistory.map((entry) => (
                        <div key={entry.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineContent}>
                            <span
                              className={`${styles.statusBadge} ${getStatusClass(entry.status)}`}
                            >
                              {STATUS_LABELS[entry.status]}
                            </span>
                            <span className={styles.timelineDate}>
                              {formatDate(entry.createdAt)}
                            </span>
                            {entry.reason && (
                              <p className={styles.timelineReason}>
                                {entry.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className={styles.modalItems}>
                  <h3 className={styles.modalSectionTitle}>Items</h3>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className={styles.modalItem}>
                      <span className={styles.modalItemEmoji}>
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className={styles.itemImage}
                          />
                        ) : (
                          '📦'
                        )}
                      </span>
                      <div className={styles.modalItemInfo}>
                        <span className={styles.modalItemName}>
                          {item.productName}
                        </span>
                        <span className={styles.modalItemQty}>
                          Quantity: {item.quantity} x $
                          {item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <span className={styles.modalItemPrice}>
                        ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.modalSummary}>
                  {selectedOrder.shipAddr && (
                    <div className={styles.summaryRow}>
                      <span>Shipping Address</span>
                      <span>{selectedOrder.shipAddr}</span>
                    </div>
                  )}
                  {selectedOrder.shipRcvrNm && (
                    <div className={styles.summaryRow}>
                      <span>Receiver</span>
                      <span>{selectedOrder.shipRcvrNm}</span>
                    </div>
                  )}
                  {selectedOrder.shipTelno && (
                    <div className={styles.summaryRow}>
                      <span>Phone</span>
                      <span>{selectedOrder.shipTelno}</span>
                    </div>
                  )}
                  {selectedOrder.shipMemo && (
                    <div className={styles.summaryRow}>
                      <span>Memo</span>
                      <span>{selectedOrder.shipMemo}</span>
                    </div>
                  )}
                  <div
                    className={`${styles.summaryRow} ${styles.summaryTotal}`}
                  >
                    <span>Total</span>
                    <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      className={styles.cancelOrderBtn}
                      disabled={cancelling}
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.contactBtn}
                    onClick={() => setSelectedOrder(null)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
