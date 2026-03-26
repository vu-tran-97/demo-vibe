'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { fetchBuyerOrders, fetchSellerSales, fetchSellerSummary, type Order, type SellerSaleItem, type SellerSummary } from '@/lib/orders';
import { fetchMyProducts, formatPrice, type Product } from '@/lib/products';
import { fetchDashboard, type DashboardData } from '@/lib/admin';
import { LoadingSpinner } from '@/components/loading-spinner/LoadingSpinner';

function getStatusClass(status: string) {
  switch (status) {
    case 'DELIVERED':
    case 'Completed':
      return 'text-success bg-[rgba(90,138,106,0.08)]';
    case 'SHIPPED':
    case 'Shipped':
      return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
    case 'PENDING':
    case 'PAID':
    case 'CONFIRMED':
    case 'Processing':
      return 'text-gold-dark bg-[rgba(200,169,110,0.1)]';
    case 'CANCELLED':
      return 'text-error bg-[rgba(196,91,91,0.08)]';
    default:
      return '';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* -- Buyer Dashboard -- */
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
    { label: 'Total Orders', value: String(totalOrders), icon: '\u25A1' },
    { label: 'Total Spent', value: formatPrice(totalSpent), icon: '\u25C7' },
    { label: 'Pending', value: String(orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length), icon: '\u25CE' },
    { label: 'Delivered', value: String(orders.filter((o) => o.status === 'DELIVERED').length), icon: '\u2713' },
  ];

  return (
    <div className="flex flex-col gap-[2rem]">
      <div className="grid grid-cols-4 gap-[1.5rem] max-md:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`bg-white border border-border-light rounded-[12px] p-[2rem] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-soft hover:border-border animate-fade-up delay-${i + 1}`}>
            <div className="text-[1.25rem] text-gold mb-[0.5rem] opacity-80">{stat.icon}</div>
            <p className="text-[0.8125rem] text-muted mb-[0.5rem] tracking-[0.02em]">{stat.label}</p>
            <p className="font-display text-[2rem] font-normal text-charcoal tracking-[-0.02em] max-sm:text-[1.5rem]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-[1rem] flex-wrap max-sm:flex-col">
        <Link href="/dashboard/products" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25C7'}</span>
          Browse Products
        </Link>
        <Link href="/dashboard/orders" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25A1'}</span>
          View Orders
        </Link>
        <Link href="/dashboard/cart" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25A3'}</span>
          My Cart
        </Link>
        <Link href="/dashboard/board" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u2630'}</span>
          Board
        </Link>
      </div>

      {/* Recent Orders */}
      <div className={`bg-white border border-border-light rounded-[12px] overflow-hidden animate-fade-up delay-5`}>
        <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 className="font-display text-[1.125rem] font-medium">Recent Orders</h2>
          <Link href="/dashboard/orders" className="font-body text-[0.8125rem] text-gold-dark bg-transparent border-none cursor-pointer font-medium transition-colors duration-[200ms] hover:text-gold">View All</Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-[3rem] px-[2rem] text-center">
            <p className="text-[0.875rem] text-muted mb-[1rem]">No orders yet. Start shopping!</p>
            <Link href="/dashboard/products" className="inline-block text-[0.8125rem] font-medium text-gold-dark transition-colors duration-[200ms] hover:text-gold">Browse Products</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Order</th>
                  <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Date</th>
                  <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Items</th>
                  <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Amount</th>
                  <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="last:*:border-b-0 hover:*:bg-[rgba(250,250,247,0.5)]">
                    <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light font-medium !text-[0.8125rem] !text-slate">{order.orderNo}</td>
                    <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light">{formatDate(order.createdAt)}</td>
                    <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light font-medium">{formatPrice(order.totalAmount)}</td>
                    <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light">
                      <span className={`inline-block text-[0.75rem] font-medium py-[3px] px-[10px] rounded-[4px] ${getStatusClass(order.status)}`}>
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

/* -- Seller Dashboard -- */
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
    { label: 'Total Products', value: String(totalProducts), icon: '\u25C7' },
    { label: 'Total Sales', value: String(summary?.totalOrders ?? 0), icon: '\u25A1' },
    { label: 'Revenue', value: formatPrice(summary?.totalRevenue ?? 0), icon: '\u25CE' },
    { label: 'This Month', value: formatPrice(summary?.monthlyBreakdown?.[0]?.revenue ?? 0), icon: '\u25A3' },
  ];

  return (
    <div className="flex flex-col gap-[2rem]">
      <div className="grid grid-cols-4 gap-[1.5rem] max-md:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`bg-white border border-border-light rounded-[12px] p-[2rem] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-soft hover:border-border animate-fade-up delay-${i + 1}`}>
            <div className="text-[1.25rem] text-gold mb-[0.5rem] opacity-80">{stat.icon}</div>
            <p className="text-[0.8125rem] text-muted mb-[0.5rem] tracking-[0.02em]">{stat.label}</p>
            <p className="font-display text-[2rem] font-normal text-charcoal tracking-[-0.02em] max-sm:text-[1.5rem]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-[1rem] flex-wrap max-sm:flex-col">
        <Link href="/dashboard/products/my" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25C8'}</span>
          My Products
        </Link>
        <Link href="/dashboard/orders/sales" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25A1'}</span>
          View Sales
        </Link>
        <Link href="/dashboard/board" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u2630'}</span>
          Board
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_380px] gap-[2rem] max-lg:grid-cols-1">
        {/* Recent Sales */}
        <div className={`bg-white border border-border-light rounded-[12px] overflow-hidden animate-fade-up delay-5`}>
          <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
            <h2 className="font-display text-[1.125rem] font-medium">Recent Sales</h2>
            <Link href="/dashboard/orders/sales" className="font-body text-[0.8125rem] text-gold-dark bg-transparent border-none cursor-pointer font-medium transition-colors duration-[200ms] hover:text-gold">View All</Link>
          </div>
          {sales.length === 0 ? (
            <div className="py-[3rem] px-[2rem] text-center">
              <p className="text-[0.875rem] text-muted mb-[1rem]">No sales yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Order</th>
                    <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Product</th>
                    <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Qty</th>
                    <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Amount</th>
                    <th className="text-left py-[1rem] px-[2rem] text-[0.75rem] font-medium text-muted tracking-[0.05em] uppercase bg-ivory">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="last:*:border-b-0 hover:*:bg-[rgba(250,250,247,0.5)]">
                      <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light font-medium !text-[0.8125rem] !text-slate">{sale.orderNo}</td>
                      <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light font-medium">{sale.productName}</td>
                      <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light">{sale.quantity}</td>
                      <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light font-medium">{formatPrice(sale.subtotalAmount)}</td>
                      <td className="py-[1rem] px-[2rem] text-[0.875rem] text-charcoal border-b border-border-light">
                        <span className={`inline-block text-[0.75rem] font-medium py-[3px] px-[10px] rounded-[4px] ${getStatusClass(sale.itemStatus)}`}>
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
        <div className="flex flex-col gap-[2rem] max-lg:grid max-lg:grid-cols-2 max-lg:gap-[2rem] max-md:grid-cols-1">
          <div className={`bg-white border border-border-light rounded-[12px] overflow-hidden animate-fade-up delay-6`}>
            <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
              <h2 className="font-display text-[1.125rem] font-medium">My Products</h2>
              <Link href="/dashboard/products/my" className="font-body text-[0.8125rem] text-gold-dark bg-transparent border-none cursor-pointer font-medium transition-colors duration-[200ms] hover:text-gold">Manage</Link>
            </div>
            <div className="py-[0.5rem]">
              {products.length === 0 ? (
                <div className="py-[3rem] px-[2rem] text-center">
                  <p className="text-[0.875rem] text-muted mb-[1rem]">No products yet.</p>
                </div>
              ) : (
                products.map((product, i) => (
                  <div key={product.id} className="flex items-center gap-[1rem] py-[1rem] px-[2rem]">
                    <span className="w-[24px] h-[24px] rounded-full bg-ivory-warm flex items-center justify-center text-[0.75rem] font-semibold text-slate shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.875rem] font-medium text-charcoal">{product.name}</span>
                      <span className="block text-[0.75rem] text-muted mt-[1px]">{product.sold} sold</span>
                    </div>
                    <span className="text-[0.875rem] font-medium text-charcoal">{formatPrice(product.price)}</span>
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

/* -- Admin Dashboard -- */
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
    { label: 'Total Users', value: String(data?.totalUsers ?? 0), icon: '\u25A3' },
    { label: 'New This Week', value: String(data?.newUsersThisWeek ?? 0), icon: '\u25CE' },
    { label: 'Sellers', value: String(data?.roleDistribution?.SELLER ?? 0), icon: '\u25C7' },
    { label: 'Buyers', value: String(data?.roleDistribution?.BUYER ?? 0), icon: '\u25A1' },
  ];

  return (
    <div className="flex flex-col gap-[2rem]">
      <div className="grid grid-cols-4 gap-[1.5rem] max-md:grid-cols-2 max-sm:grid-cols-1">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`bg-white border border-border-light rounded-[12px] p-[2rem] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-soft hover:border-border animate-fade-up delay-${i + 1}`}>
            <div className="text-[1.25rem] text-gold mb-[0.5rem] opacity-80">{stat.icon}</div>
            <p className="text-[0.8125rem] text-muted mb-[0.5rem] tracking-[0.02em]">{stat.label}</p>
            <p className="font-display text-[2rem] font-normal text-charcoal tracking-[-0.02em] max-sm:text-[1.5rem]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-[1rem] flex-wrap max-sm:flex-col">
        <Link href="/dashboard/admin/users" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25A3'}</span>
          Manage Users
        </Link>
        <Link href="/dashboard/products/my" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u25C8'}</span>
          All Products
        </Link>
        <Link href="/dashboard/board" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.5rem] bg-white border border-border-light rounded-[8px] text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-gold hover:shadow-subtle hover:text-gold-dark max-sm:justify-center">
          <span className="text-[1rem] opacity-70">{'\u2630'}</span>
          Board
        </Link>
      </div>

      {/* Recent Activity */}
      <div className={`bg-white border border-border-light rounded-[12px] overflow-hidden animate-fade-up delay-5`}>
        <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 className="font-display text-[1.125rem] font-medium">Recent Activity</h2>
          <Link href="/dashboard/admin" className="font-body text-[0.8125rem] text-gold-dark bg-transparent border-none cursor-pointer font-medium transition-colors duration-[200ms] hover:text-gold">Admin Panel</Link>
        </div>
        {(!data?.recentActivity || data.recentActivity.length === 0) ? (
          <div className="py-[3rem] px-[2rem] text-center">
            <p className="text-[0.875rem] text-muted mb-[1rem]">No recent activity.</p>
          </div>
        ) : (
          <div className="py-[0.5rem]">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-[1rem] py-[1rem] px-[2rem]">
                <div className="w-[8px] h-[8px] rounded-full bg-gold shrink-0 mt-[6px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[0.8125rem] text-charcoal leading-[1.5]">
                    <strong>{activity.userName}</strong> {activity.description}
                  </p>
                  <span className="text-[0.6875rem] text-muted mt-[2px] block">{formatDate(activity.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -- Main Dashboard Page -- */
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
