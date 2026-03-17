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
import styles from './my-products.module.css';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SOLD_OUT: 'Sold Out',
  HIDDEN: 'Hidden',
};

function getStatusClass(status?: string): string {
  switch (status) {
    case 'ACTIVE':
      return styles.statusActive;
    case 'DRAFT':
      return styles.statusDraft;
    case 'SOLD_OUT':
      return styles.statusSoldOut;
    case 'HIDDEN':
      return styles.statusHidden;
    default:
      return styles.statusDraft;
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

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isSeller = user?.role === 'SELLER' || isAdmin;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyProducts({ page, limit: 20 });
      setProducts(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page]);

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
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className={styles.accessDenied}>
        <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
        <p className={styles.accessDeniedDesc}>
          Only sellers and administrators can manage products.
        </p>
        <Link href="/dashboard/products" className={styles.accessDeniedLink}>
          &#8592; Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>{isAdmin ? 'All Products' : 'My Products'}</h2>
          <p className={styles.pageSubtitle}>
            {pagination ? `${pagination.total} products` : 'Loading...'}
          </p>
        </div>
        <Link href="/dashboard/products/create" className={styles.addBtn}>
          + Add Product
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your products...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={loadProducts}>
            Retry
          </button>
        </div>
      )}

      {/* Product List */}
      {!loading && !error && products.length > 0 && (
        <div className={styles.productList}>
          {products.map((product) => (
            <div key={product.id} className={styles.productRow}>
              <div className={styles.productThumb}>
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={styles.productThumbImg}
                  />
                )}
              </div>
              <div className={styles.productInfo}>
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className={styles.productName}
                >
                  {product.name}
                </Link>
                <div className={styles.productMeta}>
                  {isAdmin && product.seller && (
                    <span>by {product.seller.name}</span>
                  )}
                  <span>{getCategoryLabel(product.category)}</span>
                  <span>Stock: {product.stock}</span>
                  <span>Sold: {product.sold}</span>
                </div>
              </div>
              <span className={`${styles.statusBadge} ${getStatusClass(product.status)}`}>
                {STATUS_LABELS[product.status || 'DRAFT'] || product.status}
              </span>
              <span className={styles.productPrice}>
                {formatPrice(product.salePrice ?? product.price)}
              </span>
              <div className={styles.productActions}>
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className={styles.actionBtn}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleToggleStatus(product)}
                >
                  {getToggleLabel(product.status)}
                </button>
                <button
                  type="button"
                  className={styles.actionBtnDanger}
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
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9671;</div>
          <h3 className={styles.emptyTitle}>No products yet</h3>
          <p className={styles.emptyDesc}>
            Start selling by adding your first product.
          </p>
          <Link href="/dashboard/products/create" className={styles.emptyAddBtn}>
            + Add Your First Product
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &#8592; Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
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
