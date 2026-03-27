'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/utils/format';
import {
  fetchBuyerOrders,
  fetchOrderById,
  updateOrderStatus,
  type Order,
  type OrderStatus,
  type OrderListResponse,
} from '@/lib/orders';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'PAID',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

function getStatusClasses(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]';
    case 'PAID':
      return 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]';
    case 'CONFIRMED':
      return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
    case 'SHIPPED':
      return 'text-gold-dark bg-[rgba(200,169,110,0.12)]';
    case 'DELIVERED':
      return 'text-success bg-[rgba(90,138,106,0.08)]';
    case 'CANCELLED':
      return 'text-error bg-[rgba(200,80,80,0.08)]';
    default:
      return '';
  }
}

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
      setOrders(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (isSeller) {
    return (
      <div className="flex flex-col gap-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[1.75rem] font-normal">Orders</h2>
            <p className="text-[0.8125rem] text-muted mt-[2px]">
              As a seller, view your sales history.
            </p>
          </div>
        </div>
        <div className="text-center py-[3rem]">
          <Link href="/dashboard/orders/sales" className="inline-flex items-center py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-white bg-charcoal rounded-[8px] transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-soft">
            Go to Sales Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[2rem]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal">My Orders</h2>
          <p className="text-[0.8125rem] text-muted mt-[2px]">
            {loading ? 'Loading...' : `${totalCount} order${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] overflow-x-auto [-webkit-overflow-scrolling:touch] max-sm:p-[2px]">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-charcoal max-sm:py-[0.375rem] max-sm:px-[0.75rem] max-sm:text-[0.75rem] ${statusFilter === s ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>

      {/* Date Range Filters */}
      <div className="flex items-end gap-[1rem] flex-wrap">
        <div className="flex flex-col gap-[4px]">
          <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="startDate">From</label>
          <input
            id="startDate"
            type="date"
            className="py-[0.5rem] px-[0.75rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-gold"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-[4px]">
          <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="endDate">To</label>
          <input
            id="endDate"
            type="date"
            className="py-[0.5rem] px-[0.75rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-gold"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <button
            type="button"
            className="py-[0.5rem] px-[0.75rem] font-body text-[0.75rem] text-error bg-transparent border-none cursor-pointer transition-opacity duration-[200ms] hover:opacity-70"
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
        <div className="text-center py-[3rem] px-[2rem] text-error text-[0.875rem]">
          <p>{error}</p>
          <button type="button" className="mt-[1rem] py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal" onClick={loadOrders}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
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
              <h3 className="font-display text-[1.25rem] text-charcoal mb-[0.5rem]">No orders found</h3>
              <p className="text-[0.875rem] text-muted">
                Orders matching this filter will appear here.
              </p>
            </div>
          ) : (
            orders.map((order, i) => (
              <button
                key={order.id}
                type="button"
                className={`flex flex-col gap-[1rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px] cursor-pointer text-left w-full transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border hover:shadow-soft hover:-translate-y-[1px] max-sm:py-[1rem] max-sm:px-[1.5rem] animate-fade-up delay-${Math.min(i + 1, 8)}`}
                onClick={() => handleOpenDetail(order.id)}
              >
                <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
                  <div className="flex items-center gap-[1rem]">
                    <span className="font-body text-[0.875rem] font-medium text-charcoal">
                      {order.orderNo}
                    </span>
                    <span className="text-[0.75rem] text-muted">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <span
                    className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClasses(order.status)}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="flex flex-col gap-[0.5rem]">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-[1rem]">
                      <span className="text-[1.5rem] w-[40px] h-[40px] flex items-center justify-center bg-ivory rounded-[8px] shrink-0">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded-[8px]"
                          />
                        ) : (
                          '📦'
                        )}
                      </span>
                      <div className="flex-1 flex flex-col gap-[2px]">
                        <span className="text-[0.8125rem] font-medium text-charcoal">
                          {item.productName}
                        </span>
                        <span className="text-[0.75rem] text-muted">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <span className="text-[0.875rem] font-medium text-charcoal">
                        {formatPrice(item.subtotalAmount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-[0.5rem] border-t border-t-border-light">
                  <div className="flex items-center gap-[0.5rem]">
                    <span className="text-[0.8125rem] text-slate">Total</span>
                    <span className="font-display text-[1.125rem] font-normal text-charcoal">
                      {formatPrice(order.totalAmount)}
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
        <div className="flex items-center justify-center gap-[1.5rem]">
          <button
            type="button"
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-35 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-[0.8125rem] text-slate">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-35 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-[4px] flex items-center justify-center z-[100] animate-fade-in p-[2rem]"
          onClick={() => !detailLoading && setSelectedOrder(null)}
        >
          <div className="bg-white rounded-[16px] w-full max-w-[560px] max-h-[85vh] overflow-y-auto p-[2rem] animate-scale-in shadow-elevated max-sm:max-w-full max-sm:m-[1rem]" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]">
                <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
                <p>Loading order details...</p>
              </div>
            ) : selectedOrder ? (
              <>
                <div className="flex items-start justify-between mb-[1.5rem]">
                  <div>
                    <h2 className="font-display text-[1.375rem] font-normal text-charcoal">Order Details</h2>
                    <p className="text-[0.8125rem] text-muted mt-[2px]">
                      {selectedOrder.orderNo}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-[32px] h-[32px] flex items-center justify-center bg-ivory border-none rounded-[8px] cursor-pointer text-slate text-[0.875rem] transition-all duration-[200ms] hover:bg-ivory-warm hover:text-charcoal"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-[1rem] mb-[2rem]">
                  <span
                    className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClasses(selectedOrder.status)}`}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                  <span className="text-[0.8125rem] text-muted">
                    Ordered on {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>

                {/* Progress bar for non-cancelled orders */}
                {selectedOrder.status !== 'CANCELLED' && (() => {
                  const steps = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'] as const;
                  let maxIdx = steps.indexOf(selectedOrder.status as typeof steps[number]);
                  for (const item of selectedOrder.items) {
                    const itemIdx = steps.indexOf(item.itemStatus as typeof steps[number]);
                    if (itemIdx > maxIdx) maxIdx = itemIdx;
                  }
                  if (selectedOrder.statusHistory) {
                    for (const entry of selectedOrder.statusHistory) {
                      const histIdx = steps.indexOf(entry.newStatus as typeof steps[number]);
                      if (histIdx > maxIdx) maxIdx = histIdx;
                    }
                  }
                  return (
                    <div className="flex items-start justify-between mb-[2rem] p-[1.5rem] bg-ivory rounded-[12px] relative before:content-[''] before:absolute before:top-[calc(1.5rem+8px)] before:left-[calc(1.5rem+8px)] before:right-[calc(1.5rem+8px)] before:h-[2px] before:bg-border max-sm:p-[1rem]">
                      {steps.map((step, idx) => (
                        <div
                          key={step}
                          className={`flex flex-col items-center gap-[0.5rem] relative z-[1]`}
                        >
                          <div className={`w-[18px] h-[18px] rounded-full transition-all duration-[200ms] ${idx <= maxIdx ? 'bg-charcoal border-2 border-charcoal' : 'bg-white border-2 border-border'} ${idx === maxIdx ? 'border-gold bg-gold shadow-[0_0_0_4px_rgba(200,169,110,0.2)]' : ''}`} />
                          <span className={`text-[0.6875rem] whitespace-nowrap max-sm:text-[0.5625rem] ${idx <= maxIdx ? 'text-charcoal font-medium' : 'text-muted'}`}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Status History Timeline */}
                {selectedOrder.statusHistory &&
                  selectedOrder.statusHistory.length > 0 && (
                    <div className="mb-[2rem]">
                      <h3 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em] mb-[1rem]">
                        Status History
                      </h3>
                      {selectedOrder.statusHistory.map((entry) => (
                        <div key={entry.id} className="flex gap-[1rem] py-[0.5rem] [&+&]:border-t [&+&]:border-t-border-light">
                          <div className="w-[10px] h-[10px] rounded-full bg-charcoal mt-[4px] shrink-0" />
                          <div className="flex flex-wrap items-center gap-[0.5rem]">
                            <span
                              className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getStatusClasses(entry.newStatus as OrderStatus)}`}
                            >
                              {STATUS_LABELS[entry.newStatus as OrderStatus] || entry.newStatus}
                            </span>
                            <span className="text-[0.75rem] text-muted">
                              {formatDate(entry.changedAt)}
                            </span>
                            {entry.reason && (
                              <p className="w-full text-[0.75rem] text-slate mt-[2px]">
                                {entry.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="mb-[2rem]">
                  <h3 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em] mb-[1rem]">Items</h3>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-[1rem] py-[0.5rem] [&+&]:border-t [&+&]:border-t-border-light">
                      <span className="text-[1.75rem] w-[48px] h-[48px] flex items-center justify-center bg-ivory rounded-[8px]">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded-[8px]"
                          />
                        ) : (
                          '📦'
                        )}
                      </span>
                      <div className="flex-1 flex flex-col gap-[2px]">
                        <span className="text-[0.875rem] font-medium text-charcoal">
                          {item.productName}
                        </span>
                        <span className="text-[0.75rem] text-muted">
                          Quantity: {item.quantity} x {formatPrice(item.unitPrice)}
                        </span>
                      </div>
                      <span className="text-[0.9375rem] font-medium text-charcoal">
                        {formatPrice(item.subtotalAmount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-[0.5rem] p-[1.5rem] bg-ivory rounded-[12px] mb-[1.5rem]">
                  {selectedOrder.shippingAddress && (
                    <div className="flex items-center justify-between text-[0.8125rem] text-slate">
                      <span>Shipping Address</span>
                      <span>{selectedOrder.shippingAddress}</span>
                    </div>
                  )}
                  {selectedOrder.receiverName && (
                    <div className="flex items-center justify-between text-[0.8125rem] text-slate">
                      <span>Receiver</span>
                      <span>{selectedOrder.receiverName}</span>
                    </div>
                  )}
                  {selectedOrder.receiverPhone && (
                    <div className="flex items-center justify-between text-[0.8125rem] text-slate">
                      <span>Phone</span>
                      <span>{selectedOrder.receiverPhone}</span>
                    </div>
                  )}
                  {selectedOrder.shippingMemo && (
                    <div className="flex items-center justify-between text-[0.8125rem] text-slate">
                      <span>Memo</span>
                      <span>{selectedOrder.shippingMemo}</span>
                    </div>
                  )}
                  <div
                    className="flex items-center justify-between text-[0.9375rem] font-medium text-charcoal pt-[0.5rem] border-t border-t-border-light"
                  >
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-[0.5rem] justify-end max-sm:flex-col">
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      className="py-[0.625rem] px-[1.25rem] font-body text-[0.8125rem] font-medium rounded-[8px] cursor-pointer transition-all duration-[200ms] bg-transparent text-error border border-[rgba(200,80,80,0.3)] hover:bg-[rgba(200,80,80,0.06)] hover:border-error"
                      disabled={cancelling}
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="py-[0.625rem] px-[1.25rem] font-body text-[0.8125rem] font-medium rounded-[8px] cursor-pointer transition-all duration-[200ms] bg-transparent text-slate border border-border hover:border-charcoal hover:text-charcoal"
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
