'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchMyProducts,
  deleteProduct,
  updateProductStatus,
  formatPrice,
  getCategoryLabel,
  type Product,
  type Pagination,
} from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SOLD_OUT: 'Sold Out',
  HIDDEN: 'Hidden',
};

function getStatusClass(status?: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-success bg-[rgba(74,149,115,0.08)]';
    case 'DRAFT':
      return 'text-muted bg-ivory-warm';
    case 'SOLD_OUT':
      return 'text-error bg-[rgba(196,91,91,0.08)]';
    case 'HIDDEN':
      return 'text-slate bg-ivory';
    default:
      return 'text-muted bg-ivory-warm';
  }
}

function getToggleTarget(currentStatus?: string): string {
  return currentStatus === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
}

function getToggleLabel(currentStatus?: string): string {
  return currentStatus === 'ACTIVE' ? 'Hide' : 'Activate';
}

export default function MyProductsPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isSeller = user?.role === 'SELLER' || isAdmin;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await fetchMyProducts(params as Parameters<typeof fetchMyProducts>[0]);
      setProducts(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (!authLoading && isSeller) {
      loadProducts();
    }
  }, [authLoading, isSeller, loadProducts]);

  const handleToggleStatus = async (product: Product) => {
    const newStatus = getToggleTarget(product.status);
    try {
      await updateProductStatus(product.id, newStatus);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
        <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="text-center py-[8rem] px-[2rem]">
        <h2 className="font-display text-[1.5rem] font-normal text-charcoal mb-[0.5rem]">Access Denied</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          Only sellers and administrators can manage products.
        </p>
        <Link href="/dashboard/products" className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-[200ms] hover:text-gold">
          &#8592; Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-[1.5rem] max-sm:flex-col max-sm:items-start max-sm:gap-[1rem]">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal text-charcoal">{isAdmin ? 'All Products' : 'My Products'}</h2>
          <p className="text-[0.875rem] text-muted mt-[0.25rem]">
            {pagination ? `${pagination.total} products` : 'Loading...'}
          </p>
        </div>
        <Link href="/dashboard/products/create" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border border-charcoal rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:bg-charcoal-light hover:-translate-y-px">
          + Add Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-[1rem] mb-[2rem] flex-wrap max-sm:flex-col max-sm:items-stretch">
        <form
          className="flex flex-1 min-w-[200px] max-w-[480px] border border-border rounded-[8px] overflow-hidden transition-colors duration-[200ms] focus-within:border-gold max-sm:max-w-full"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        >
          <input
            type="text"
            className="flex-1 py-[0.5rem] px-[0.875rem] font-body text-[0.8125rem] text-charcoal border-none outline-none bg-white placeholder:text-muted"
            placeholder={isAdmin ? 'Search by product name or seller...' : 'Search products...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none cursor-pointer transition-colors duration-[200ms] hover:bg-charcoal-light">Search</button>
        </form>
        <select
          className="py-[0.5rem] px-[0.875rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none cursor-pointer transition-colors duration-[200ms] focus:border-gold"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="ACTV">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="SOLD_OUT">Sold Out</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        {(search || statusFilter) && (
          <button
            type="button"
            className="py-[0.5rem] px-[0.875rem] font-body text-[0.75rem] font-medium text-error bg-transparent border-none cursor-pointer transition-opacity duration-[200ms] hover:opacity-70"
            onClick={() => { setSearchInput(''); setSearch(''); setStatusFilter(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading your products...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-[4rem] px-[2rem] text-error text-[0.9375rem]">
          <p>{error}</p>
          <button type="button" className="mt-[1rem] py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal" onClick={loadProducts}>
            Retry
          </button>
        </div>
      )}

      {/* Product List */}
      {!loading && !error && products.length > 0 && (
        <div className="flex flex-col gap-[1rem] animate-fade-in">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-[1.5rem] p-[1.5rem] bg-white border border-border-light rounded-[12px] transition-all duration-[200ms] hover:border-border hover:shadow-soft max-sm:flex-col max-sm:items-start">
              <div className="w-[80px] h-[60px] rounded-[8px] bg-[linear-gradient(145deg,#E8E4DE,#D4CFC6)] shrink-0 overflow-hidden relative">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="font-display text-[1rem] font-medium text-charcoal mb-[4px] no-underline block hover:text-gold-dark"
                >
                  {product.name}
                </Link>
                {isAdmin && product.seller && (
                  <p className="text-[0.8125rem] text-slate mb-[4px]">
                    Seller: <strong className="text-charcoal font-semibold">{product.seller.nickname || product.seller.name}</strong>
                  </p>
                )}
                <div className="flex items-center gap-[1rem] text-[0.75rem] text-muted">
                  <span>{getCategoryLabel(product.category)}</span>
                  <span>Stock: {product.stock}</span>
                  <span>Sold: {product.sold}</span>
                </div>
              </div>
              <span className={`inline-flex py-[3px] px-[10px] text-[0.6875rem] font-semibold tracking-[0.06em] uppercase rounded-[4px] shrink-0 ${getStatusClass(product.status)}`}>
                {STATUS_LABELS[product.status || 'DRAFT'] || product.status}
              </span>
              <span className="text-[0.9375rem] font-medium text-charcoal shrink-0 min-w-[80px] text-right max-sm:text-left">
                {formatPrice(product.salePrice ?? product.price)}
              </span>
              <div className="flex gap-[0.5rem] shrink-0 max-sm:w-full">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="py-[0.375rem] px-[0.875rem] font-body text-[0.75rem] font-medium text-slate bg-white border border-border-light rounded-[4px] cursor-pointer transition-all duration-[200ms] no-underline whitespace-nowrap hover:border-charcoal hover:text-charcoal max-sm:flex-1 max-sm:text-center"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="py-[0.375rem] px-[0.875rem] font-body text-[0.75rem] font-medium text-slate bg-white border border-border-light rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:border-charcoal hover:text-charcoal max-sm:flex-1 max-sm:text-center"
                  onClick={() => handleToggleStatus(product)}
                >
                  {getToggleLabel(product.status)}
                </button>
                <button
                  type="button"
                  className="py-[0.375rem] px-[0.875rem] font-body text-[0.75rem] font-medium text-slate bg-white border border-border-light rounded-[4px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:border-error hover:text-error max-sm:flex-1 max-sm:text-center"
                  onClick={() => handleDelete(product)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-[8rem] px-[2rem]">
          <div className="text-[3rem] mb-[1.5rem] opacity-30">&#9671;</div>
          <h3 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">No products yet</h3>
          <p className="text-[0.9375rem] text-muted mb-[2rem]">
            Start selling by adding your first product.
          </p>
          <Link href="/dashboard/products/create" className="inline-block py-[0.75rem] px-[2rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal rounded-[8px] no-underline transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal-light hover:-translate-y-[2px]">
            + Add Your First Product
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-[1.5rem] mt-[3rem] pt-[2rem] border-t border-border-light">
          <button
            type="button"
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &#8592; Previous
          </button>
          <span className="text-[0.8125rem] text-slate">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next &#8594;
          </button>
        </div>
      )}
    </div>
  );
}
