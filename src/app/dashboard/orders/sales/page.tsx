'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/utils/format';
import {
  fetchSellerSales,
  fetchSellerSummary,
  fetchSellerOrderDetail,
  updateItemStatus,
  confirmItemPayment,
  bulkUpdateItemStatus,
  type ItemStatus,
  type SellerSaleItem,
  type SellerSalesResponse,
  type SellerSummary,
  type SellerOrderDetail,
} from '@/lib/orders';

const ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAID: 'Paid',
};

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
] as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  EMAIL_INVOICE: 'Email Invoice',
};

function getItemStatusClasses(status: string) {
  switch (status) {
    case 'PENDING':
      return 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]';
    case 'CONFIRMED':
      return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
    case 'SHIPPED':
      return 'text-gold-dark bg-[rgba(200,169,110,0.12)]';
    case 'DELIVERED':
      return 'text-success bg-[rgba(90,138,106,0.08)]';
    case 'CANCELLED':
      return 'text-error bg-[rgba(200,80,80,0.08)]';
    case 'PAID':
      return 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]';
    default:
      return '';
  }
}

export default function SalesPage() {
  const { user } = useAuth(true);

  const [summary, setSummary] = useState<SellerSummary | null>(null);
  const [sales, setSales] = useState<SellerSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkTracking, setBulkTracking] = useState('');

  // Detail modal
  const [detailOrder, setDetailOrder] = useState<SellerOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchSellerSummary();
      setSummary(data);
    } catch {
      // Summary is optional
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data: SellerSalesResponse = await fetchSellerSales(params);
      setSales(data.sales);
      setTotalPages(data.totalPages);
      setTotalCount(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (user) {
      loadSummary();
    }
  }, [user, loadSummary]);

  useEffect(() => {
    if (user) {
      loadSales();
    }
  }, [user, loadSales]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, startDate, endDate]);

  async function handleUpdateItemStatus(
    sale: SellerSaleItem,
    newStatus: ItemStatus,
  ) {
    setUpdatingId(sale.id);
    try {
      const tracking =
        newStatus === 'SHIPPED' ? trackingInputs[sale.id] : undefined;
      await updateItemStatus(sale.orderId, sale.id, newStatus, tracking);
      loadSales();
      loadSummary();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleBulkAction(newStatus: ItemStatus) {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const tracking =
        newStatus === 'SHIPPED' && bulkTracking ? bulkTracking : undefined;
      const result = await bulkUpdateItemStatus(
        Array.from(selectedIds),
        newStatus,
        tracking,
      );
      alert(`Updated: ${result.updated}, Failed: ${result.failed}`);
      setSelectedIds(new Set());
      setBulkTracking('');
      loadSales();
      loadSummary();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleOpenDetail(orderId: string) {
    setDetailLoading(true);
    try {
      const detail = await fetchSellerOrderDetail(orderId);
      setDetailOrder(detail);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to load order detail',
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirmPayment(sale: SellerSaleItem) {
    setUpdatingId(sale.id);
    try {
      await confirmItemPayment(sale.orderId, sale.id);
      loadSales();
      loadSummary();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sales.map((s) => s.id)));
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="flex flex-col gap-[2rem]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal">Sales Dashboard</h2>
          <p className="text-[0.8125rem] text-muted mt-[2px]">
            {loading
              ? 'Loading...'
              : `${totalCount} sale${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/orders" className="text-[0.8125rem] text-gold-dark transition-colors duration-[200ms] hover:text-gold">
          Back to Orders
        </Link>
      </div>

      {/* Revenue Summary */}
      {summaryLoading ? (
        <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[1rem] max-sm:grid-cols-1">
            <div className="flex flex-col gap-[0.25rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px]">
              <span className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]">Total Revenue</span>
              <span className="font-display text-[1.75rem] font-normal text-charcoal">
                {formatPrice(summary.totalRevenue)}
              </span>
            </div>
            <div className="flex flex-col gap-[0.25rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px]">
              <span className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]">Total Orders</span>
              <span className="font-display text-[1.75rem] font-normal text-charcoal">
                {summary.totalOrders}
              </span>
            </div>
          </div>

          {summary.monthlyBreakdown.length > 0 && (
            <div className="flex flex-col gap-[1rem]">
              <h3 className="font-body text-[0.8125rem] font-semibold text-slate uppercase tracking-[0.05em]">Monthly Breakdown</h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-[0.5rem]">
                {summary.monthlyBreakdown.map((m) => (
                  <div key={m.month} className="flex flex-col gap-[4px] py-[1rem] px-[1.5rem] bg-ivory rounded-[8px]">
                    <span className="text-[0.75rem] font-medium text-slate">{m.month}</span>
                    <span className="font-display text-[1.125rem] text-charcoal">
                      {formatPrice(m.revenue)}
                    </span>
                    <span className="text-[0.6875rem] text-muted">
                      {m.orderCount} order{m.orderCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Filters */}
      <div className="flex items-end gap-[1rem] flex-wrap max-sm:flex-col max-sm:items-stretch">
        <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] overflow-x-auto [-webkit-overflow-scrolling:touch]">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-charcoal ${statusFilter === s ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All' : ITEM_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-[4px]">
          <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="salesStartDate">
            From
          </label>
          <input
            id="salesStartDate"
            type="date"
            className="py-[0.5rem] px-[0.75rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-gold"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-[4px]">
          <label className="text-[0.75rem] font-medium text-slate uppercase tracking-[0.04em]" htmlFor="salesEndDate">
            To
          </label>
          <input
            id="salesEndDate"
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

      {/* Error */}
      {error && (
        <div className="text-center py-[3rem] px-[2rem] text-error text-[0.875rem]">
          <p>{error}</p>
          <button
            type="button"
            className="mt-[1rem] py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal"
            onClick={loadSales}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading sales...</p>
        </div>
      )}

      {/* Sales List */}
      {!loading && !error && (
        <div className="flex flex-col gap-[0.5rem]">
          {sales.length === 0 ? (
            <div className="text-center py-[6rem] px-[2rem]">
              <h3 className="font-display text-[1.25rem] text-charcoal mb-[0.5rem]">No sales found</h3>
              <p className="text-[0.875rem] text-muted">
                Sales matching this filter will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-[8px] mb-[4px]">
                <input
                  type="checkbox"
                  className="w-[18px] h-[18px] accent-charcoal cursor-pointer"
                  checked={selectedIds.size === sales.length && sales.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className="text-[0.75rem] text-slate">
                  Select all
                </span>
              </div>

              {sales.map((sale, i) => (
                <div
                  key={sale.id}
                  className={`flex items-center gap-[1.5rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px] transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border hover:shadow-soft max-sm:flex-col max-sm:items-start max-sm:gap-[1rem] max-sm:py-[1rem] max-sm:px-[1.5rem] max-md:flex-wrap animate-fade-up delay-${Math.min(i + 1, 8)} ${selectedIds.has(sale.id) ? 'border-gold bg-[rgba(200,169,110,0.03)]' : ''}`}
                >
                  {/* Checkbox */}
                  <div className="shrink-0">
                    <input
                      type="checkbox"
                      className="w-[18px] h-[18px] accent-charcoal cursor-pointer"
                      checked={selectedIds.has(sale.id)}
                      onChange={() => toggleSelect(sale.id)}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[0.75rem] text-gold-dark cursor-pointer transition-colors duration-[200ms] hover:text-charcoal hover:underline"
                      onClick={() => handleOpenDetail(sale.orderId)}
                    >
                      {sale.orderNo}
                    </p>
                    <p className="text-[0.875rem] font-medium text-charcoal">{sale.productName}</p>
                    <p className="text-[0.75rem] text-muted">
                      Qty: {sale.quantity} x {formatPrice(sale.unitPrice)}
                    </p>
                    {sale.trackingNumber && (
                      <p className="text-[0.6875rem] text-gold-dark mt-[2px]">
                        Tracking: {sale.trackingNumber}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-[4px] shrink-0 max-sm:items-start max-sm:flex-row max-sm:gap-[1rem]">
                    <span className="font-display text-[1rem] font-normal text-charcoal">
                      {formatPrice(sale.subtotalAmount)}
                    </span>
                    <span className="text-[0.6875rem] text-muted">
                      {formatDate(sale.orderedAt)}
                    </span>
                    <span
                      className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getItemStatusClasses(sale.orderStatus === 'PAID' ? 'PAID' : sale.itemStatus)}`}
                    >
                      {ITEM_STATUS_LABELS[sale.itemStatus] || sale.itemStatus}
                    </span>
                    <span
                      className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${sale.paymentStatus === 'PAID' ? 'text-[#2E7D32] bg-[rgba(46,125,50,0.08)]' : 'text-[#b8860b] bg-[rgba(184,134,11,0.08)]'}`}
                    >
                      {sale.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-[4px] shrink-0 max-sm:flex-row max-sm:flex-wrap">
                    {sale.paymentStatus !== 'PAID' && (
                      <button
                        type="button"
                        className="py-[0.375rem] px-[0.75rem] font-body text-[0.6875rem] font-medium text-white bg-[#2E7D32] border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:not-disabled:bg-[#1B5E20] disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={updatingId === sale.id}
                        onClick={() => handleConfirmPayment(sale)}
                      >
                        {updatingId === sale.id ? 'Updating...' : 'Confirm Payment'}
                      </button>
                    )}
                    {sale.itemStatus === 'PENDING' && (
                      <button
                        type="button"
                        className="py-[0.375rem] px-[0.75rem] font-body text-[0.6875rem] font-medium text-white bg-charcoal border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={updatingId === sale.id}
                        onClick={() =>
                          handleUpdateItemStatus(sale, 'CONFIRMED')
                        }
                      >
                        {updatingId === sale.id ? 'Updating...' : 'Confirm Order'}
                      </button>
                    )}
                    {sale.itemStatus === 'CONFIRMED' && (
                      <div className="flex gap-[4px] items-center max-sm:flex-col max-sm:items-stretch">
                        <input
                          type="text"
                          className="py-[0.3rem] px-[0.5rem] font-body text-[0.6875rem] text-charcoal bg-white border border-border rounded-[4px] outline-none w-[120px] transition-[border-color] duration-[200ms] focus:border-gold max-sm:w-full"
                          placeholder="Tracking #"
                          value={trackingInputs[sale.id] || ''}
                          onChange={(e) =>
                            setTrackingInputs((prev) => ({
                              ...prev,
                              [sale.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="py-[0.375rem] px-[0.75rem] font-body text-[0.6875rem] font-medium text-white bg-gold-dark border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:not-disabled:bg-gold disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={updatingId === sale.id}
                          onClick={() =>
                            handleUpdateItemStatus(sale, 'SHIPPED')
                          }
                        >
                          {updatingId === sale.id ? '...' : 'Ship'}
                        </button>
                      </div>
                    )}
                    {sale.itemStatus === 'SHIPPED' && (
                      <button
                        type="button"
                        className="py-[0.375rem] px-[0.75rem] font-body text-[0.6875rem] font-medium text-white bg-charcoal border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={updatingId === sale.id}
                        onClick={() =>
                          handleUpdateItemStatus(sale, 'DELIVERED')
                        }
                      >
                        {updatingId === sale.id ? 'Updating...' : 'Deliver'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-[1.5rem] flex items-center justify-between gap-[1rem] py-[1rem] px-[2rem] bg-charcoal text-white rounded-[12px] shadow-elevated z-10 animate-[slideUp_0.2s_cubic-bezier(0.16,1,0.3,1)] max-sm:flex-col max-sm:gap-[0.5rem] max-sm:p-[1rem] max-sm:bottom-[0.5rem] max-sm:mx-[0.5rem]">
          <span className="text-[0.8125rem] font-medium">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-[0.5rem] items-center max-sm:flex-wrap max-sm:justify-center">
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-medium text-charcoal bg-white border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('CONFIRMED')}
            >
              Bulk Confirm
            </button>
            <input
              type="text"
              className="py-[0.4rem] px-[0.6rem] font-body text-[0.75rem] text-charcoal bg-white border-none rounded-[4px] outline-none w-[140px]"
              placeholder="Tracking # (optional)"
              value={bulkTracking}
              onChange={(e) => setBulkTracking(e.target.value)}
            />
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-medium text-charcoal bg-white border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('SHIPPED')}
            >
              Bulk Ship
            </button>
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-medium text-charcoal bg-white border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('DELIVERED')}
            >
              Bulk Deliver
            </button>
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.75rem] font-medium text-white bg-transparent border border-[rgba(255,255,255,0.3)] rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:border-white"
              onClick={() => {
                setSelectedIds(new Set());
                setBulkTracking('');
              }}
            >
              Cancel
            </button>
          </div>
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
      {(detailOrder || detailLoading) && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-[4px] flex items-center justify-center z-[100] animate-fade-in p-[2rem]"
          onClick={() => !detailLoading && setDetailOrder(null)}
        >
          <div
            className="bg-white rounded-[16px] w-full max-w-[640px] max-h-[85vh] overflow-y-auto p-[2rem] animate-scale-in shadow-elevated max-sm:max-w-full max-sm:m-[1rem] max-sm:p-[1.5rem]"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex flex-col items-center gap-[1rem] py-[6rem] px-[2rem] text-muted text-[0.875rem]">
                <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
                <p>Loading order details...</p>
              </div>
            ) : detailOrder ? (
              <>
                <div className="flex items-center justify-between mb-[1.5rem]">
                  <h2 className="font-display text-[1.375rem] font-normal text-charcoal">
                    Order {detailOrder.orderNo}
                  </h2>
                  <button
                    type="button"
                    className="w-[32px] h-[32px] flex items-center justify-center bg-ivory border-none rounded-[8px] cursor-pointer text-slate text-[0.875rem] transition-all duration-[200ms] hover:bg-ivory-warm hover:text-charcoal"
                    onClick={() => setDetailOrder(null)}
                  >
                    &#10005;
                  </button>
                </div>

                {/* Order Info */}
                <div className="mb-[1.5rem]">
                  <h4 className="text-[0.75rem] font-semibold text-slate uppercase tracking-[0.04em] mb-[0.5rem]">Order Information</h4>
                  <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                    <span className="text-slate">Status</span>
                    <span
                      className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getItemStatusClasses(detailOrder.status)}`}
                    >
                      {ITEM_STATUS_LABELS[detailOrder.status] || detailOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                    <span className="text-slate">Payment Method</span>
                    <span className="font-medium text-charcoal">
                      {detailOrder.paymentMethod
                        ? PAYMENT_METHOD_LABELS[detailOrder.paymentMethod] ||
                          detailOrder.paymentMethod
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                    <span className="text-slate">Total Amount</span>
                    <span className="font-medium text-charcoal">
                      {formatPrice(detailOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                    <span className="text-slate">Date</span>
                    <span className="font-medium text-charcoal">
                      {formatDateTime(detailOrder.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="h-[1px] bg-border-light my-[1rem]" />

                {/* Buyer Info */}
                <div className="mb-[1.5rem]">
                  <h4 className="text-[0.75rem] font-semibold text-slate uppercase tracking-[0.04em] mb-[0.5rem]">Buyer Information</h4>
                  {detailOrder.buyer ? (
                    <>
                      <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                        <span className="text-slate">Name</span>
                        <span className="font-medium text-charcoal">
                          {detailOrder.buyer.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                        <span className="text-slate">Email</span>
                        <span className="font-medium text-charcoal">
                          {detailOrder.buyer.email}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[0.8125rem] text-muted">
                      Buyer information unavailable
                    </p>
                  )}
                  {detailOrder.receiverName && (
                    <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                      <span className="text-slate">Receiver</span>
                      <span className="font-medium text-charcoal">
                        {detailOrder.receiverName}
                      </span>
                    </div>
                  )}
                  {detailOrder.receiverPhone && (
                    <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                      <span className="text-slate">Phone</span>
                      <span className="font-medium text-charcoal">
                        {detailOrder.receiverPhone}
                      </span>
                    </div>
                  )}
                  {detailOrder.shippingAddress && (
                    <div className="flex justify-between py-[0.25rem] text-[0.8125rem]">
                      <span className="text-slate">Address</span>
                      <span className="font-medium text-charcoal">
                        {detailOrder.shippingAddress}
                      </span>
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-border-light my-[1rem]" />

                {/* Items */}
                <div className="mb-[1.5rem]">
                  <h4 className="text-[0.75rem] font-semibold text-slate uppercase tracking-[0.04em] mb-[0.5rem]">Items</h4>
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-[1rem] py-[0.5rem] border-b border-b-border-light last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] font-medium text-charcoal">
                          {item.productName}
                        </p>
                        <p className="text-[0.75rem] text-muted">
                          Qty: {item.quantity} x {formatPrice(item.unitPrice)} ={' '}
                          {formatPrice(item.subtotalAmount)}
                          {item.trackingNumber && (
                            <> | Tracking: {item.trackingNumber}</>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getItemStatusClasses(item.itemStatus)}`}
                        >
                          {ITEM_STATUS_LABELS[item.itemStatus] || item.itemStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-[1px] bg-border-light my-[1rem]" />

                {/* Status Timeline */}
                <div className="mb-[1.5rem]">
                  <h4 className="text-[0.75rem] font-semibold text-slate uppercase tracking-[0.04em] mb-[0.5rem]">Status Timeline</h4>
                  <div className="flex flex-col gap-[0.5rem]">
                    {detailOrder.statusHistory.map((h) => (
                      <div key={h.id} className="flex gap-[1rem] text-[0.8125rem]">
                        <div className="w-[8px] h-[8px] bg-charcoal rounded-full shrink-0 mt-[5px]" />
                        <div className="flex-1">
                          <span className="font-medium text-charcoal">
                            {h.previousStatus || '(new)'} &rarr; {h.newStatus}
                          </span>
                          <span className="text-[0.6875rem] text-muted ml-[0.5rem]">
                            {formatDateTime(h.changedAt)}
                          </span>
                          {h.reason && (
                            <p className="text-[0.75rem] text-slate mt-[2px]">{h.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
