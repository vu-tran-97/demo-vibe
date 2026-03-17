'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import {
  fetchSellerSales,
  fetchSellerSummary,
  updateOrderStatus,
  type OrderStatus,
  type SellerSaleItem,
  type SellerSalesResponse,
  type SellerSummary,
} from '@/lib/orders';
import styles from './sales.module.css';

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

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await fetchSellerSummary();
      setSummary(data);
    } catch {
      // Summary is optional; do not block the page
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
  }, [statusFilter, startDate, endDate]);

  async function handleUpdateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      loadSales();
      loadSummary();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
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
              {s === 'ALL' ? 'All' : STATUS_LABELS[s as OrderStatus]}
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
            sales.map((sale, i) => (
              <div
                key={sale.id}
                className={`${styles.saleCard} animate-fade-up delay-${Math.min(i + 1, 8)}`}
              >
                <div className={styles.saleInfo}>
                  <p className={styles.saleOrderNum}>{sale.orderNumber}</p>
                  <p className={styles.saleProduct}>{sale.productName}</p>
                  <p className={styles.saleBuyer}>
                    Buyer: {sale.buyerName}
                  </p>
                  <p className={styles.saleQty}>
                    Qty: {sale.quantity} x ${sale.unitPrice.toFixed(2)}
                  </p>
                </div>

                <div className={styles.saleMeta}>
                  <span className={styles.salePrice}>
                    ${sale.totalPrice.toFixed(2)}
                  </span>
                  <span className={styles.saleDate}>
                    {formatDate(sale.createdAt)}
                  </span>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(sale.status)}`}
                  >
                    {STATUS_LABELS[sale.status]}
                  </span>
                </div>

                <div className={styles.saleActions}>
                  {sale.status === 'PENDING' && (
                    <button
                      type="button"
                      className={styles.statusBtn}
                      disabled={updatingId === sale.id}
                      onClick={() =>
                        handleUpdateStatus(sale.id, 'SHIPPED')
                      }
                    >
                      {updatingId === sale.id
                        ? 'Updating...'
                        : 'Mark Shipped'}
                    </button>
                  )}
                  {sale.status === 'SHIPPED' && (
                    <button
                      type="button"
                      className={styles.statusBtn}
                      disabled={updatingId === sale.id}
                      onClick={() =>
                        handleUpdateStatus(sale.id, 'DELIVERED')
                      }
                    >
                      {updatingId === sale.id
                        ? 'Updating...'
                        : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              </div>
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
    </div>
  );
}
