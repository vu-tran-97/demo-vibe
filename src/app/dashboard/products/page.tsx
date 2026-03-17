'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchProducts,
  CATEGORIES,
  formatPrice,
  type Product,
  type Pagination,
} from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { showToast } from '@/components/toast/Toast';
import styles from './products.module.css';

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const RATING_OPTIONS = [4, 3, 2, 1];

function ProductsContent() {
  const { user } = useAuth(false);
  const { addItem } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter state — initialized from URL
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cats = searchParams.get('categories');
    return cats ? cats.split(',').filter(Boolean) : [];
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (searchParams.get('sort') as SortOption) || 'popular';
  });
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState<number | null>(() => {
    const r = searchParams.get('minRating');
    return r ? parseInt(r, 10) : null;
  });
  const [inStock, setInStock] = useState(() => searchParams.get('inStock') === 'true');
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p, 10) : 1;
  });

  const isSeller = user?.role === 'SELLER' || user?.role === 'SUPER_ADMIN';

  // Sync filter state to URL
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minRating !== null) params.set('minRating', String(minRating));
    if (inStock) params.set('inStock', 'true');
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(`/dashboard/products${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedCategories, sortBy, search, minPrice, maxPrice, minRating, inStock, page, router]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({
        page,
        limit: 12,
        categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        search: search || undefined,
        sort: sortBy,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: minRating ?? undefined,
        inStock: inStock || undefined,
      });
      setProducts(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategories, search, sortBy, minPrice, maxPrice, minRating, inStock]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryToggle = (categoryCode: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryCode)) {
        return prev.filter((c) => c !== categoryCode);
      }
      return [...prev, categoryCode];
    });
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  const handleRatingFilter = (rating: number) => {
    setMinRating((prev) => (prev === rating ? null : rating));
    setPage(1);
  };

  const handleInStockToggle = () => {
    setInStock((prev) => !prev);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSortBy('popular');
    setSearch('');
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(null);
    setInStock(false);
    setPage(1);
  };

  const handlePriceApply = () => {
    setPage(1);
    // Triggers re-fetch via useEffect dependency
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePriceApply();
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || minPrice || maxPrice || minRating !== null || inStock;

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

      {/* Mobile filter toggle */}
      <div className={styles.mobileFilterToggle}>
        <button
          type="button"
          className={styles.filterToggleBtn}
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Filters {hasActiveFilters ? `(${[selectedCategories.length > 0, !!minPrice || !!maxPrice, minRating !== null, inStock].filter(Boolean).length})` : ''}
        </button>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Filters + Sort */}
      <div className={`${styles.filterPanel} ${mobileFiltersOpen ? styles.filterPanelOpen : ''}`}>
        {/* Categories — multi-select checkboxes */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Categories</h4>
          <div className={styles.categoryCheckboxes}>
            {CATEGORIES.map((cat) => (
              <label key={cat.code} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedCategories.includes(cat.code)}
                  onChange={() => handleCategoryToggle(cat.code)}
                />
                <span className={styles.checkboxText}>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Price Range</h4>
          <div className={styles.priceRange}>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceApply}
              onKeyDown={handlePriceKeyDown}
              min="0"
              step="0.01"
            />
            <span className={styles.priceSep}>&mdash;</span>
            <input
              type="number"
              className={styles.priceInput}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={handlePriceApply}
              onKeyDown={handlePriceKeyDown}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Rating Filter */}
        <div className={styles.filterGroup}>
          <h4 className={styles.filterGroupTitle}>Minimum Rating</h4>
          <div className={styles.ratingButtons}>
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                type="button"
                className={`${styles.ratingBtn} ${minRating === rating ? styles.ratingBtnActive : ''}`}
                onClick={() => handleRatingFilter(rating)}
              >
                {rating}+ <span className={styles.ratingStar}>&#9733;</span>
              </button>
            ))}
          </div>
        </div>

        {/* In Stock Toggle */}
        <div className={styles.filterGroup}>
          <label className={styles.toggleLabel}>
            <span className={styles.toggleText}>In Stock Only</span>
            <button
              type="button"
              className={`${styles.toggleSwitch} ${inStock ? styles.toggleSwitchOn : ''}`}
              onClick={handleInStockToggle}
              role="switch"
              aria-checked={inStock}
            >
              <span className={styles.toggleKnob} />
            </button>
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearFiltersBtn}
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        )}

        {/* Sort (desktop — inside filter panel) */}
        <div className={styles.desktopSort}>
          <h4 className={styles.filterGroupTitle}>Sort By</h4>
          <select
            className={styles.sortSelectInline}
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
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
            <div key={product.id} className={styles.productCard}>
              <Link
                href={`/dashboard/products/${product.id}`}
                className={styles.productCardLink}
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
              {user?.role === 'BUYER' && product.stock > 0 && (
                <button
                  type="button"
                  className={styles.quickAddBtn}
                  onClick={() => {
                    const result = addItem(product);
                    if (result.success) {
                      showToast(result.message);
                    } else {
                      showToast(result.message, 'error');
                    }
                  }}
                >
                  + Add to Cart
                </button>
              )}
              {product.stock === 0 && (
                <span className={styles.outOfStockLabel}>Out of Stock</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9671;</div>
          <h3 className={styles.emptyTitle}>No products found</h3>
          <p className={styles.emptyDesc}>
            Try selecting a different category or adjusting your filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFiltersBtn}
              onClick={handleClearFilters}
              style={{ marginTop: '1rem' }}
            >
              Clear All Filters
            </button>
          )}
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading products...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
