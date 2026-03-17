'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchProducts,
  CATEGORIES,
  formatPrice,
  type Product,
  type Pagination,
} from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import styles from './products.module.css';

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

const SORT_MAP: Record<SortOption, string> = {
  popular: 'popular',
  newest: 'newest',
  'price-low': 'price-low',
  'price-high': 'price-high',
  rating: 'rating',
};

export default function ProductsPage() {
  const { user } = useAuth(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const isSeller = user?.role === 'SELLER' || user?.role === 'SUPER_ADMIN';

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({
        page,
        limit: 12,
        category: activeCategory || undefined,
        search: search || undefined,
        sort: SORT_MAP[sortBy],
      });
      setProducts(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, search, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Products</h2>
          <p className={styles.pageSubtitle}>
            {pagination ? `${pagination.total} items available` : 'Loading...'}
          </p>
        </div>
        {isSeller && (
          <div className={styles.headerActions}>
            <Link href="/dashboard/products/my" className={styles.myProductsBtn}>
              My Products
            </Link>
            <Link href="/dashboard/products/create" className={styles.addProductBtn}>
              + Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn}>
          Search
        </button>
      </form>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.categoryFilters}>
          <button
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === null ? styles.categoryBtnActive : ''}`}
            onClick={() => handleCategoryChange(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`${styles.categoryBtn} ${activeCategory === cat.code ? styles.categoryBtnActive : ''}`}
              onClick={() => handleCategoryChange(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading products...</p>
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

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/products/${product.id}`}
              className={styles.productCard}
            >
              <div className={styles.productImage}>
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
                )}
                {product.salePrice !== null && (
                  <span className={styles.saleBadge}>Sale</span>
                )}
              </div>
              <div className={styles.productBody}>
                <p className={styles.productCategory}>
                  {product.categoryLabel}
                </p>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productSeller}>
                  by {product.seller.name}
                </p>
                <div className={styles.productMeta}>
                  <div>
                    <span className={styles.productPrice}>
                      {formatPrice(product.salePrice ?? product.price)}
                    </span>
                    {product.salePrice !== null && (
                      <span className={styles.originalPrice}>
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <span className={styles.productRating}>
                    <span className={styles.ratingStar}>&#9733;</span>
                    {product.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9671;</div>
          <h3 className={styles.emptyTitle}>No products found</h3>
          <p className={styles.emptyDesc}>
            Try selecting a different category or adjusting your search.
          </p>
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
