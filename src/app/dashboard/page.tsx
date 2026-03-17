'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { fetchBuyerOrders, fetchSellerSales, fetchSellerSummary, type Order, type SellerSaleItem, type SellerSummary } from '@/lib/orders';
import { fetchMyProducts, formatPrice, type Product } from '@/lib/products';
import { fetchDashboard, type DashboardData } from '@/lib/admin';
import { LoadingSpinner } from '@/components/loading-spinner/LoadingSpinner';
import styles from './dashboard.module.css';

function getStatusClass(status: string) {
  switch (status) {
    case 'DELIVERED':
    case 'Completed':
      return styles.statusCompleted;
    case 'SHIPPED':
    case 'Shipped':
      return styles.statusShipped;
    case 'PENDING':
    case 'PAID':
    case 'CONFIRMED':
    case 'Processing':
      return styles.statusProcessing;
    case 'CANCELLED':
      return styles.statusCancelled;
    default:
      return '';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Buyer Dashboard ── */
function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchBuyerOrders({ limit: 5 });
        setOrders(res.items);
        setTotalOrders(res.pagination.total);
        const spent = res.items.reduce((sum, o) => sum + o.totalAmount, 0);
        setTotalSpent(spent);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = [
    { label: 'Total Orders', value: String(totalOrders), icon: '□' },
    { label: 'Total Spent', value: formatPrice(totalSpent), icon: '◇' },
    { label: 'Pending', value: String(orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length), icon: '◎' },
    { label: 'Delivered', value: String(orders.filter((o) => o.status === 'DELIVERED').length), icon: '✓' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`${styles.statCard} animate-fade-up delay-${i + 1}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/dashboard/products" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>◇</span>
          Browse Products
        </Link>
        <Link href="/dashboard/orders" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>□</span>
          View Orders
        </Link>
        <Link href="/dashboard/cart" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>▣</span>
          My Cart
        </Link>
        <Link href="/dashboard/board" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>☰</span>
          Board
        </Link>
      </div>

      {/* Recent Orders */}
      <div className={`${styles.card} animate-fade-up delay-5`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Orders</h2>
          <Link href="/dashboard/orders" className={styles.cardAction}>View All</Link>
        </div>
        {orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>No orders yet. Start shopping!</p>
            <Link href="/dashboard/products" className={styles.emptyLink}>Browse Products</Link>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.orderId}>{order.orderNo}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className={styles.amount}>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Seller Dashboard ── */
function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sales, setSales] = useState<SellerSaleItem[]>([]);
  const [summary, setSummary] = useState<SellerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, salesRes, summaryRes] = await Promise.all([
          fetchMyProducts({ limit: 5 }),
          fetchSellerSales({ limit: 5 }),
          fetchSellerSummary(),
        ]);
        setProducts(prodRes.items);
        setTotalProducts(prodRes.pagination.total);
        setSales(salesRes.sales);
        setSummary(summaryRes);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = [
    { label: 'Total Products', value: String(totalProducts), icon: '◇' },
    { label: 'Total Sales', value: String(summary?.totalOrders ?? 0), icon: '□' },
    { label: 'Revenue', value: formatPrice(summary?.totalRevenue ?? 0), icon: '◎' },
    { label: 'This Month', value: formatPrice(summary?.monthlyBreakdown?.[0]?.revenue ?? 0), icon: '▣' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`${styles.statCard} animate-fade-up delay-${i + 1}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/dashboard/products/my" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>◈</span>
          My Products
        </Link>
        <Link href="/dashboard/orders/sales" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>□</span>
          View Sales
        </Link>
        <Link href="/dashboard/board" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>☰</span>
          Board
        </Link>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Recent Sales */}
        <div className={`${styles.card} animate-fade-up delay-5`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Sales</h2>
            <Link href="/dashboard/orders/sales" className={styles.cardAction}>View All</Link>
          </div>
          {sales.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.emptyText}>No sales yet.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className={styles.orderId}>{sale.orderNo}</td>
                      <td className={styles.productName}>{sale.productName}</td>
                      <td>{sale.quantity}</td>
                      <td className={styles.amount}>{formatPrice(sale.subtotalAmount)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(sale.itemStatus)}`}>
                          {sale.itemStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className={styles.rightCol}>
          <div className={`${styles.card} animate-fade-up delay-6`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>My Products</h2>
              <Link href="/dashboard/products/my" className={styles.cardAction}>Manage</Link>
            </div>
            <div className={styles.productList}>
              {products.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p className={styles.emptyText}>No products yet.</p>
                </div>
              ) : (
                products.map((product, i) => (
                  <div key={product.id} className={styles.productItem}>
                    <span className={styles.productRank}>{i + 1}</span>
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{product.name}</span>
                      <span className={styles.productSold}>{product.sold} sold</span>
                    </div>
                    <span className={styles.productRevenue}>{formatPrice(product.price)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Admin Dashboard ── */
function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDashboard();
        setDashboardData(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const data = dashboardData;
  const stats = [
    { label: 'Total Users', value: String(data?.totalUsers ?? 0), icon: '▣' },
    { label: 'New This Week', value: String(data?.newUsersThisWeek ?? 0), icon: '◎' },
    { label: 'Sellers', value: String(data?.roleDistribution?.SELLER ?? 0), icon: '◇' },
    { label: 'Buyers', value: String(data?.roleDistribution?.BUYER ?? 0), icon: '□' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`${styles.statCard} animate-fade-up delay-${i + 1}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={styles.statValue}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/dashboard/admin/users" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>▣</span>
          Manage Users
        </Link>
        <Link href="/dashboard/products/my" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>◈</span>
          All Products
        </Link>
        <Link href="/dashboard/board" className={styles.quickActionBtn}>
          <span className={styles.quickActionIcon}>☰</span>
          Board
        </Link>
      </div>

      {/* Recent Activity */}
      <div className={`${styles.card} animate-fade-up delay-5`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Activity</h2>
          <Link href="/dashboard/admin" className={styles.cardAction}>Admin Panel</Link>
        </div>
        {(!data?.recentActivity || data.recentActivity.length === 0) ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>No recent activity.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityContent}>
                  <p className={styles.activityDesc}>
                    <strong>{activity.userName}</strong> {activity.description}
                  </p>
                  <span className={styles.activityTime}>{formatDate(activity.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ── */
export default function DashboardPage() {
  const { user, loading } = useAuth(true);

  if (loading) {
    return <LoadingSpinner />;
  }

  switch (user?.role) {
    case 'SELLER':
      return <SellerDashboard />;
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'BUYER':
    default:
      return <BuyerDashboard />;
  }
}
