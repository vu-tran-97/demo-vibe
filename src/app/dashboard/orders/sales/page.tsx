'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  fetchSellerSales,
  fetchSellerSummary,
  fetchSellerOrderDetail,
  updateItemStatus,
  bulkUpdateItemStatus,
  type ItemStatus,
  type SellerSaleItem,
  type SellerSalesResponse,
  type SellerSummary,
  type SellerOrderDetail,
} from '@/lib/orders';
import styles from './sales.module.css';

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

  function getItemStatusClass(status: string) {
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
      case 'PAID':
        return styles.statusPaid;
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
    <div className={styles.sales}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Sales Dashboard</h2>
          <p className={styles.pageSubtitle}>
            {loading
              ? 'Loading...'
              : `${totalCount} sale${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/orders" className={styles.backLink}>
          Back to Orders
        </Link>
      </div>

      {/* Revenue Summary */}
      {summaryLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      ) : summary ? (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Revenue</span>
              <span className={styles.summaryValue}>
                ${summary.totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Orders</span>
              <span className={styles.summaryValue}>
                {summary.totalOrders}
              </span>
            </div>
          </div>

          {summary.monthlyBreakdown.length > 0 && (
            <div className={styles.monthlySection}>
              <h3 className={styles.sectionTitle}>Monthly Breakdown</h3>
              <div className={styles.monthlyGrid}>
                {summary.monthlyBreakdown.map((m) => (
                  <div key={m.month} className={styles.monthCard}>
                    <span className={styles.monthName}>{m.month}</span>
                    <span className={styles.monthRevenue}>
                      ${m.revenue.toFixed(2)}
                    </span>
                    <span className={styles.monthOrders}>
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
      <div className={styles.filters}>
        <div className={styles.statusTabs}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.tab} ${statusFilter === s ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All' : ITEM_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className={styles.dateField}>
          <label className={styles.dateLabel} htmlFor="salesStartDate">
            From
          </label>
          <input
            id="salesStartDate"
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateField}>
          <label className={styles.dateLabel} htmlFor="salesEndDate">
            To
          </label>
          <input
            id="salesEndDate"
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

      {/* Error */}
      {error && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={loadSales}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading sales...</p>
        </div>
      )}

      {/* Sales List */}
      {!loading && !error && (
        <div className={styles.salesList}>
          {sales.length === 0 ? (
            <div className={styles.emptyState}>
              <h3 className={styles.emptyTitle}>No sales found</h3>
              <p className={styles.emptyDesc}>
                Sales matching this filter will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedIds.size === sales.length && sales.length > 0}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                  Select all
                </span>
              </div>

              {sales.map((sale, i) => (
                <div
                  key={sale.id}
                  className={`${styles.saleCard} ${selectedIds.has(sale.id) ? styles.saleCardSelected : ''} animate-fade-up delay-${Math.min(i + 1, 8)}`}
                >
                  {/* Checkbox */}
                  <div className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIds.has(sale.id)}
                      onChange={() => toggleSelect(sale.id)}
                    />
                  </div>

                  {/* Info */}
                  <div className={styles.saleInfo}>
                    <p
                      className={styles.saleOrderNum}
                      onClick={() => handleOpenDetail(sale.orderId)}
                    >
                      {sale.orderNo}
                    </p>
                    <p className={styles.saleProduct}>{sale.productName}</p>
                    <p className={styles.saleQty}>
                      Qty: {sale.quantity} x ${sale.unitPrice.toFixed(2)}
                    </p>
                    {sale.trackingNumber && (
                      <p className={styles.saleTracking}>
                        Tracking: {sale.trackingNumber}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className={styles.saleMeta}>
                    <span className={styles.salePrice}>
                      ${sale.subtotalAmount.toFixed(2)}
                    </span>
                    <span className={styles.saleDate}>
                      {formatDate(sale.orderedAt)}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${getItemStatusClass(sale.itemStatus)}`}
                    >
                      {ITEM_STATUS_LABELS[sale.itemStatus] || sale.itemStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className={styles.saleActions}>
                    {sale.itemStatus === 'PENDING' && (
                      <button
                        type="button"
                        className={styles.statusBtn}
                        disabled={updatingId === sale.id}
                        onClick={() =>
                          handleUpdateItemStatus(sale, 'CONFIRMED')
                        }
                      >
                        {updatingId === sale.id ? 'Updating...' : 'Confirm'}
                      </button>
                    )}
                    {sale.itemStatus === 'CONFIRMED' && (
                      <div className={styles.trackingRow}>
                        <input
                          type="text"
                          className={styles.trackingInput}
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
                          className={styles.shipBtn}
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
                        className={styles.statusBtn}
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
        <div className={styles.bulkBar}>
          <span className={styles.bulkInfo}>
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkBtn}
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('CONFIRMED')}
            >
              Bulk Confirm
            </button>
            <input
              type="text"
              className={styles.bulkTrackingInput}
              placeholder="Tracking # (optional)"
              value={bulkTracking}
              onChange={(e) => setBulkTracking(e.target.value)}
            />
            <button
              type="button"
              className={styles.bulkBtn}
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('SHIPPED')}
            >
              Bulk Ship
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('DELIVERED')}
            >
              Bulk Deliver
            </button>
            <button
              type="button"
              className={styles.bulkCancelBtn}
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
      {(detailOrder || detailLoading) && (
        <div
          className={styles.modalOverlay}
          onClick={() => !detailLoading && setDetailOrder(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Loading order details...</p>
              </div>
            ) : detailOrder ? (
              <>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>
                    Order {detailOrder.orderNo}
                  </h2>
                  <button
                    type="button"
                    className={styles.modalClose}
                    onClick={() => setDetailOrder(null)}
                  >
                    &#10005;
                  </button>
                </div>

                {/* Order Info */}
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>Order Information</h4>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Status</span>
                    <span
                      className={`${styles.statusBadge} ${getItemStatusClass(detailOrder.status)}`}
                    >
                      {ITEM_STATUS_LABELS[detailOrder.status] || detailOrder.status}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Payment Method</span>
                    <span className={styles.detailValue}>
                      {detailOrder.paymentMethod
                        ? PAYMENT_METHOD_LABELS[detailOrder.paymentMethod] ||
                          detailOrder.paymentMethod
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Amount</span>
                    <span className={styles.detailValue}>
                      ${detailOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Date</span>
                    <span className={styles.detailValue}>
                      {formatDateTime(detailOrder.createdAt)}
                    </span>
                  </div>
                </div>

                <div className={styles.detailDivider} />

                {/* Buyer Info */}
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>Buyer Information</h4>
                  {detailOrder.buyer ? (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Name</span>
                        <span className={styles.detailValue}>
                          {detailOrder.buyer.name}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>
                          {detailOrder.buyer.email}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                      Buyer information unavailable
                    </p>
                  )}
                  {detailOrder.receiverName && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Receiver</span>
                      <span className={styles.detailValue}>
                        {detailOrder.receiverName}
                      </span>
                    </div>
                  )}
                  {detailOrder.receiverPhone && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Phone</span>
                      <span className={styles.detailValue}>
                        {detailOrder.receiverPhone}
                      </span>
                    </div>
                  )}
                  {detailOrder.shippingAddress && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Address</span>
                      <span className={styles.detailValue}>
                        {detailOrder.shippingAddress}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.detailDivider} />

                {/* Items */}
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>Items</h4>
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className={styles.detailItem}>
                      <div className={styles.detailItemInfo}>
                        <p className={styles.detailItemName}>
                          {item.productName}
                        </p>
                        <p className={styles.detailItemMeta}>
                          Qty: {item.quantity} x ${item.unitPrice.toFixed(2)} ={' '}
                          ${item.subtotalAmount.toFixed(2)}
                          {item.trackingNumber && (
                            <> | Tracking: {item.trackingNumber}</>
                          )}
                        </p>
                      </div>
                      <div className={styles.detailItemStatus}>
                        <span
                          className={`${styles.statusBadge} ${getItemStatusClass(item.itemStatus)}`}
                        >
                          {ITEM_STATUS_LABELS[item.itemStatus] || item.itemStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.detailDivider} />

                {/* Status Timeline */}
                <div className={styles.modalSection}>
                  <h4 className={styles.modalSectionTitle}>Status Timeline</h4>
                  <div className={styles.timeline}>
                    {detailOrder.statusHistory.map((h) => (
                      <div key={h.id} className={styles.timelineItem}>
                        <div className={styles.timelineDot} />
                        <div className={styles.timelineContent}>
                          <span className={styles.timelineStatus}>
                            {h.previousStatus || '(new)'} &rarr; {h.newStatus}
                          </span>
                          <span className={styles.timelineDate}>
                            {formatDateTime(h.changedAt)}
                          </span>
                          {h.reason && (
                            <p className={styles.timelineReason}>{h.reason}</p>
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
