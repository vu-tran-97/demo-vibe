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

  // Sellers should use My Products, not all products
  useEffect(() => {
    if (user && user.role === 'SELLER') {
      router.replace('/dashboard/products/my');
    }
  }, [user, router]);

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
      <div className="flex items-center justify-between mb-[3rem] max-sm:flex-col max-sm:items-start max-sm:gap-[1rem]">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal text-charcoal">Products</h2>
          <p className="text-[0.875rem] text-muted mt-[0.25rem]">
            {pagination ? `${pagination.total} items available` : 'Loading...'}
          </p>
        </div>
        {isSeller && (
          <div className="flex gap-[1rem] items-center max-sm:w-full">
            <Link href="/dashboard/products/my" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:border-charcoal hover:bg-ivory">
              My Products
            </Link>
            <Link href="/dashboard/products/create" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border border-charcoal rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:bg-charcoal-light hover:-translate-y-[1px]">
              + Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Search */}
      <form className="flex gap-[0.5rem] mb-[1.5rem] max-sm:flex-col" onSubmit={handleSearch}>
        <input
          type="text"
          className="flex-1 py-[0.625rem] px-[1rem] font-body text-[0.875rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="py-[0.625rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal-light">
          Search
        </button>
      </form>

      {/* Mobile filter toggle */}
      <div className="hidden max-sm:flex gap-[0.5rem] mb-[1.5rem] items-center">
        <button
          type="button"
          className="flex items-center gap-[0.5rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal"
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
          className="py-[0.5rem] px-[0.875rem] font-body text-[0.8125rem] text-slate bg-white border border-border-light rounded-[8px] cursor-pointer outline-none transition-[border-color] duration-[200ms] ml-auto focus:border-charcoal"
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Filters + Sort */}
      <div className={`flex flex-wrap gap-[1.5rem] items-start mb-[2rem] p-[1.5rem] bg-white border border-border-light rounded-[12px] max-md:flex-col max-md:gap-[1rem] max-sm:flex-col max-sm:gap-[1rem] max-sm:max-h-0 max-sm:overflow-hidden max-sm:py-0 max-sm:px-[1.5rem] max-sm:mb-0 max-sm:border-transparent max-sm:opacity-0 max-sm:transition-all max-sm:duration-300 max-sm:ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileFiltersOpen ? 'max-sm:!max-h-[800px] max-sm:!p-[1.5rem] max-sm:!mb-[2rem] max-sm:!border-border-light max-sm:!opacity-100' : ''}`}>
        {/* Categories — multi-select checkboxes */}
        <div className="min-w-[160px]">
          <h4 className="font-body text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em] mb-[0.5rem]">Categories</h4>
          <div className="flex flex-wrap gap-[0.25rem]">
            {CATEGORIES.map((cat) => (
              <label key={cat.code} className="flex items-center gap-[6px] py-[0.375rem] px-[0.75rem] font-body text-[0.8125rem] text-slate cursor-pointer border border-border-light rounded-[8px] transition-all duration-[200ms] whitespace-nowrap hover:border-border hover:text-charcoal has-[input:checked]:bg-charcoal has-[input:checked]:text-white has-[input:checked]:border-charcoal">
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedCategories.includes(cat.code)}
                  onChange={() => handleCategoryToggle(cat.code)}
                />
                <span className="pointer-events-none">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="min-w-[160px]">
          <h4 className="font-body text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em] mb-[0.5rem]">Price Range</h4>
          <div className="flex items-center gap-[0.5rem]">
            <input
              type="number"
              className="w-[90px] py-[0.5rem] px-[0.625rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted max-sm:w-full max-sm:flex-1"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceApply}
              onKeyDown={handlePriceKeyDown}
              min="0"
              step="0.01"
            />
            <span className="text-muted text-[0.8125rem]">&mdash;</span>
            <input
              type="number"
              className="w-[90px] py-[0.5rem] px-[0.625rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted max-sm:w-full max-sm:flex-1"
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
        <div className="min-w-[160px]">
          <h4 className="font-body text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em] mb-[0.5rem]">Minimum Rating</h4>
          <div className="flex gap-[0.25rem]">
            {RATING_OPTIONS.map((rating) => (
              <button
                key={rating}
                type="button"
                className={`flex items-center gap-[4px] py-[0.375rem] px-[0.75rem] font-body text-[0.8125rem] text-slate bg-white border border-border-light rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-border hover:text-charcoal ${minRating === rating ? 'bg-charcoal text-white border-charcoal' : ''}`}
                onClick={() => handleRatingFilter(rating)}
              >
                {rating}+ <span className={`text-gold ${minRating === rating ? 'text-gold' : ''}`}>&#9733;</span>
              </button>
            ))}
          </div>
        </div>

        {/* In Stock Toggle */}
        <div className="min-w-[160px]">
          <label className="flex items-center justify-between gap-[1rem] cursor-pointer">
            <span className="font-body text-[0.8125rem] text-charcoal">In Stock Only</span>
            <button
              type="button"
              className={`relative w-[40px] h-[22px] border-none rounded-[11px] cursor-pointer transition-[background] duration-[200ms] p-0 ${inStock ? 'bg-charcoal' : 'bg-border'}`}
              onClick={handleInStockToggle}
              role="switch"
              aria-checked={inStock}
            >
              <span className={`absolute top-[3px] left-[3px] w-[16px] h-[16px] bg-white rounded-full transition-transform duration-[200ms] shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${inStock ? 'translate-x-[18px]' : ''}`} />
            </button>
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-muted bg-transparent border border-border-light rounded-[8px] cursor-pointer transition-all duration-[200ms] self-end hover:text-charcoal hover:border-charcoal"
            onClick={handleClearFilters}
          >
            Clear All Filters
          </button>
        )}

        {/* Sort (desktop — inside filter panel) */}
        <div className="ml-auto max-md:ml-0 max-sm:hidden">
          <h4 className="font-body text-[0.6875rem] font-semibold text-muted uppercase tracking-[0.08em] mb-[0.5rem]">Sort By</h4>
          <select
            className="py-[0.5rem] px-[0.875rem] font-body text-[0.8125rem] text-slate bg-white border border-border-light rounded-[8px] cursor-pointer outline-none transition-[border-color] duration-[200ms] focus:border-charcoal"
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
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading products...</p>
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

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[1.5rem] animate-fade-in max-md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] max-sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-sm:gap-[1rem]">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-border-light rounded-[12px] overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col hover:border-border hover:shadow-soft hover:-translate-y-[4px]">
              <Link
                href={`/dashboard/products/${product.id}`}
                className="block no-underline text-inherit cursor-pointer flex-1"
              >
                <div className="aspect-[4/3] bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] relative overflow-hidden">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                  )}
                  {product.salePrice !== null && (
                    <span className="absolute top-[1rem] left-[1rem] py-[4px] px-[10px] text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-white bg-error rounded-[4px] z-[1]">Sale</span>
                  )}
                </div>
                <div className="p-[1.5rem]">
                  <p className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-gold mb-[0.25rem]">
                    {product.categoryLabel}
                  </p>
                  <h3 className="font-display text-[1.125rem] font-medium text-charcoal mb-[0.5rem] leading-[1.3]">{product.name}</h3>
                  <p className="text-[0.75rem] text-muted mt-[0.5rem]">
                    by {product.seller.name}
                  </p>
                  <div className="flex items-center justify-between mt-[1rem]">
                    <div>
                      <span className="text-[0.9375rem] font-medium text-charcoal">
                        {formatPrice(product.salePrice ?? product.price)}
                      </span>
                      {product.salePrice !== null && (
                        <span className="text-[0.8125rem] text-muted line-through ml-[0.5rem]">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-[4px] text-[0.8125rem] text-slate">
                      <span className="text-gold">&#9733;</span>
                      {product.rating}
                    </span>
                  </div>
                </div>
              </Link>
              {product.stock > 0 && (
                <button
                  type="button"
                  className="block w-full py-[0.625rem] font-body text-[0.8125rem] font-medium text-charcoal bg-ivory border-none border-t border-t-border-light cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal hover:text-white"
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
                <span className="block w-full py-[0.625rem] font-body text-[0.8125rem] font-medium text-muted bg-ivory border-t border-t-border-light text-center">Out of Stock</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="text-center py-[8rem] px-[2rem]">
          <div className="text-[3rem] mb-[1.5rem] opacity-30">&#9671;</div>
          <h3 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">No products found</h3>
          <p className="text-[0.9375rem] text-muted">
            Try selecting a different category or adjusting your filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-muted bg-transparent border border-border-light rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:border-charcoal mt-[1rem]"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-[1.5rem] mt-[3rem] pt-[2rem] border-t border-t-border-light">
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

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading products...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
