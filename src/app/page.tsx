'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { CATEGORIES, fetchProducts, formatPrice, type Product } from '@/lib/products';
import { useCart } from '@/hooks/use-cart';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { ToastContainer, showToast } from '@/components/toast/Toast';

const ITEMS_PER_PAGE = 24;
const BANNER_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1280&h=400&fit=crop',
    title: 'Handcrafted Collection',
    subtitle: 'Discover unique artisan pieces made with love',
  },
  {
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=400&fit=crop',
    title: 'New Arrivals',
    subtitle: 'Fresh finds from top sellers this week',
  },
  {
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1280&h=400&fit=crop',
    title: 'Shop by Category',
    subtitle: 'Ceramics, textiles, art, jewelry and more',
  },
];

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem: cartAddItem, totalItems: cartCount } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
  const initialQuery = searchParams.get('q') || '';
  const [headerSearch, setHeaderSearch] = useState(initialQuery);

  // Filters
  const [search, setSearch] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sort, setSort] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const sortMap: Record<SortOption, string> = useMemo(() => ({
    popular: 'popular',
    newest: 'newest',
    'price-low': 'price-low',
    'price-high': 'price-high',
    rating: 'rating',
  }), []);

  // Fetch products — reset on filter change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts({
      page: 1,
      limit: ITEMS_PER_PAGE,
      category: activeCategory !== 'ALL' ? activeCategory : undefined,
      search: search.trim() || undefined,
      sort: sortMap[sort],
    })
      .then((res) => {
        setProducts(res.items);
        setTotalCount(res.pagination.total);
        setHasMore(res.pagination.page < res.pagination.totalPages);
      })
      .catch(() => {
        setProducts([]);
        setTotalCount(0);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [activeCategory, search, sort, sortMap]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchProducts({
      page: nextPage,
      limit: ITEMS_PER_PAGE,
      category: activeCategory !== 'ALL' ? activeCategory : undefined,
      search: search.trim() || undefined,
      sort: sortMap[sort],
    })
      .then((res) => {
        setProducts((prev) => [...prev, ...res.items]);
        setPage(nextPage);
        setHasMore(res.pagination.page < res.pagination.totalPages);
      })
      .finally(() => setLoadingMore(false));
  }

  const refreshAuth = useCallback(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

  async function handleLogout() {
    await authLogout();
    setLoggedIn(false);
    setUser(null);
  }

  function openLogin() {
    setAuthModalView('login');
    setAuthModalOpen(true);
  }

  function openSignup() {
    setAuthModalView('signup');
    setAuthModalOpen(true);
  }

  function handleHeaderSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = headerSearch.trim();
    if (!trimmed) return;
    setSearch(trimmed);
  }

  function handleHeaderSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleHeaderSearch(e);
    }
  }


  const paged = products;

  function getProductHref(product: Product) {
    return `/products/${product.id}`;
  }

  function handleQuickAdd(e: React.MouseEvent, product: Product) {
    e.preventDefault();
    e.stopPropagation();
    const result = cartAddItem(product);
    if (result.success) {
      showToast(result.message);
    } else {
      showToast(result.message, 'error');
    }
  }

  function getDiscount(product: Product) {
    if (!product.salePrice) return 0;
    return Math.round(((product.price - product.salePrice) / product.price) * 100);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Bar ── */}
      <div className="bg-charcoal text-[rgba(255,255,255,0.7)] text-[0.75rem] max-sm:hidden">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.5rem] flex items-center justify-between">
          <div className="flex items-center gap-[1rem]">
            <span>Download App</span>
            <span className="opacity-30">|</span>
            <span>Help Center</span>
          </div>
          <div className="flex items-center gap-[1rem]">
            {loggedIn ? (
              <span>Welcome, {user?.nickname || user?.name}!</span>
            ) : (
              <>
                <button
                  type="button"
                  className="bg-none border-none text-[rgba(255,255,255,0.7)] font-body text-[0.75rem] cursor-pointer transition-colors duration-[200ms] p-0 hover:text-white"
                  onClick={openSignup}
                >
                  Sign Up
                </button>
                <span className="opacity-30">|</span>
                <button
                  type="button"
                  className="bg-none border-none text-[rgba(255,255,255,0.7)] font-body text-[0.75rem] cursor-pointer transition-colors duration-[200ms] p-0 hover:text-white"
                  onClick={openLogin}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-[100] bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.75rem] flex items-center gap-[2rem] max-sm:px-[1rem] max-sm:py-[0.625rem] max-sm:gap-[0.5rem]">
          <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] shrink-0 max-sm:text-[1.375rem]">
            Vibe
          </Link>

          {/* Search */}
          <form className="flex-1 max-w-[640px] flex border-[2px] border-gold rounded-[8px] overflow-hidden transition-shadow duration-[200ms] focus-within:shadow-[0_0_0_3px_rgba(200,169,110,0.15)]" onSubmit={handleHeaderSearch}>
            <input
              type="text"
              className="flex-1 px-[1rem] py-[0.625rem] font-body text-[0.875rem] text-charcoal border-none outline-none bg-white placeholder:text-muted max-[479px]:text-[0.8125rem] max-[479px]:px-[0.75rem] max-[479px]:py-[0.5rem]"
              placeholder="Search for products, brands, and more..."
              value={headerSearch}
              onChange={(e) => {
                setHeaderSearch(e.target.value);
                // Also update local filter for non-logged-in users
                if (!loggedIn) {
                  setSearch(e.target.value);
                }
              }}
              onKeyDown={handleHeaderSearchKeyDown}
            />
            <button type="submit" className="px-[1rem] bg-gold border-none text-white cursor-pointer flex items-center justify-center transition-colors duration-[200ms] hover:bg-gold-dark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          {/* Cart + User */}
          <div className="flex items-center gap-[1rem] shrink-0 ml-auto max-[479px]:gap-[0.5rem]">
            <Link href="/cart" className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-transparent border-none text-charcoal cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:bg-ivory hover:text-gold-dark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-[2px] right-0 min-w-[18px] h-[18px] px-[5px] flex items-center justify-center text-[0.625rem] font-bold text-white bg-error rounded-[9px] leading-none pointer-events-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {loggedIn && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <button
                type="button"
                className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-transparent border-none text-charcoal cursor-pointer transition-all duration-[200ms] whitespace-nowrap hover:bg-ivory hover:text-gold-dark"
                onClick={openLogin}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Auth Modal ── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        onSuccess={refreshAuth}
      />

      {/* ── Category Nav ── */}
      <nav className="bg-white border-b border-border-light">
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[0.625rem] flex gap-[0.5rem] overflow-x-auto scrollbar-none max-sm:px-[1rem] max-sm:py-[0.5rem]">
          <button
            type="button"
            className={`px-[1rem] py-[0.4375rem] font-body text-[0.8125rem] font-normal rounded-full whitespace-nowrap cursor-pointer transition-all duration-[200ms] ${
              activeCategory === 'ALL'
                ? 'bg-gold border border-gold text-white font-medium hover:bg-gold-dark hover:border-gold-dark'
                : 'text-slate bg-transparent border border-border hover:border-gold hover:text-gold-dark'
            }`}
            onClick={() => setActiveCategory('ALL')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`px-[1rem] py-[0.4375rem] font-body text-[0.8125rem] font-normal rounded-full whitespace-nowrap cursor-pointer transition-all duration-[200ms] ${
                activeCategory === cat.code
                  ? 'bg-gold border border-gold text-white font-medium hover:bg-gold-dark hover:border-gold-dark'
                  : 'text-slate bg-transparent border border-border hover:border-gold hover:text-gold-dark'
              }`}
              onClick={() => setActiveCategory(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Hero Banner Carousel ── */}
      <section className="max-w-[1280px] mx-auto px-[2rem] pt-[1.5rem] max-sm:px-[1rem]">
        <div className="relative rounded-[12px] overflow-hidden">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
            {BANNER_SLIDES.map((slide, i) => (
              <div key={i} className="min-w-full relative">
                <img src={slide.image} alt={slide.title} className="w-full h-[320px] object-cover block max-sm:h-[200px]" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.1)_60%,transparent_100%)] flex flex-col justify-center px-[4rem] max-sm:px-[1.5rem]">
                  <h2 className="font-display text-[2rem] font-semibold text-white m-0 [text-shadow:0_2px_8px_rgba(0,0,0,0.3)] max-sm:text-[1.25rem]">{slide.title}</h2>
                  <p className="text-[1rem] text-[rgba(255,255,255,0.85)] mt-[0.5rem] [text-shadow:0_1px_4px_rgba(0,0,0,0.3)] max-sm:text-[0.8125rem]">{slide.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-[1rem] left-1/2 -translate-x-1/2 flex gap-[0.5rem]">
            {BANNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`w-[10px] h-[10px] rounded-full p-0 cursor-pointer transition-all duration-[200ms] ${
                  i === bannerIndex
                    ? 'bg-white border-[2px] border-white'
                    : 'bg-transparent border-[2px] border-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.5)]'
                }`}
                onClick={() => setBannerIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className="flex-1 bg-ivory py-[2rem] pb-[4rem]">
        <div className="max-w-[1280px] mx-auto px-[2rem] max-sm:px-[1rem]">
          {/* Sort Bar */}
          <div className="flex items-center justify-between gap-[1rem] px-[1.5rem] py-[1rem] mb-[1.5rem] bg-white rounded-[8px] border border-border-light max-md:flex-col max-md:items-start">
            <div className="shrink-0">
              <span className="text-[0.8125rem] text-slate [&>strong]:text-charcoal [&>strong]:font-medium">
                {totalCount} product{totalCount !== 1 ? 's' : ''}
                {activeCategory !== 'ALL' && (
                  <> in <strong>{CATEGORIES.find((c) => c.code === activeCategory)?.label}</strong></>
                )}
                {search && (
                  <> matching &ldquo;<strong>{search}</strong>&rdquo;</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-[0.25rem] overflow-x-auto scrollbar-none max-sm:flex-wrap">
              <span className="text-[0.8125rem] text-muted mr-[0.25rem] whitespace-nowrap shrink-0">Sort by:</span>
              {([
                { value: 'popular', label: 'Popular' },
                { value: 'newest', label: 'Latest' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
                { value: 'rating', label: 'Top Rated' },
              ] as { value: SortOption; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-[0.875rem] py-[0.375rem] font-body text-[0.8125rem] rounded-[4px] cursor-pointer whitespace-nowrap transition-all duration-[200ms] ${
                    sort === opt.value
                      ? 'bg-gold text-white border border-gold hover:bg-gold-dark'
                      : 'text-slate bg-transparent border border-transparent hover:bg-ivory hover:text-charcoal'
                  }`}
                  onClick={() => setSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {paged.length === 0 ? (
            <div className="text-center px-[2rem] py-[8rem]">
              <div className="text-border mb-[1.5rem]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3 className="font-display text-[1.5rem] font-normal text-charcoal mb-[0.5rem]">No products found</h3>
              <p className="text-[0.9375rem] text-muted mb-[2rem]">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <button
                type="button"
                className="px-[1.5rem] py-[0.625rem] font-body text-[0.875rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-charcoal-light"
                onClick={() => { setSearch(''); setActiveCategory('ALL'); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-[1rem] max-md:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-[0.5rem]">
              {paged.map((product) => (
                <div key={product.id} className="bg-white rounded-[12px] overflow-hidden border border-border-light transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col hover:border-border hover:shadow-soft hover:-translate-y-[4px]">
                  <Link
                    href={getProductHref(product)}
                    className="block no-underline text-inherit cursor-pointer flex-1"
                  >
                    <div className="aspect-square bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] relative overflow-hidden">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                      )}
                      {product.salePrice !== null && (
                        <span className="absolute top-[0.5rem] right-[0.5rem] bg-error text-white text-[0.6875rem] font-bold px-[6px] py-[2px] rounded-[4px] z-[1]">{getDiscount(product)}%</span>
                      )}
                    </div>
                    <div className="p-[1rem]">
                      <h3 className="font-body text-[0.875rem] font-normal text-charcoal leading-[1.4] line-clamp-2 min-h-[2.45em]">{product.name}</h3>
                      <p className="text-[0.75rem] text-muted mt-[4px]">{product.seller?.name || 'Unknown Seller'}</p>
                      <div className="flex items-center justify-between gap-[0.5rem] mt-[0.5rem]">
                        <div className="flex items-baseline gap-[0.5rem]">
                          <span className="text-[1.0625rem] font-semibold text-error">
                            {formatPrice(product.salePrice ?? product.price)}
                          </span>
                          {product.salePrice !== null && (
                            <span className="text-[0.75rem] text-muted line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        {product.stock > 0 && (
                          <button
                            type="button"
                            className="flex items-center justify-center w-[32px] h-[32px] shrink-0 rounded-full border border-border-light bg-white text-charcoal cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-charcoal hover:text-white hover:border-charcoal"
                            onClick={(e) => { e.preventDefault(); handleQuickAdd(e, product); }}
                            aria-label="Add to cart"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-[0.5rem] pt-[0.5rem] border-t border-border-light">
                        <span className="text-[0.75rem] text-slate">
                          <span className="text-gold">&#9733;</span> {product.rating}
                        </span>
                        <span className="text-[0.6875rem] text-muted">{product.sold} sold</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="flex flex-col items-center gap-[1rem] mt-[3rem] pb-[1.5rem]">
              <span className="text-[0.8125rem] text-muted">
                Showing {products.length.toLocaleString()} of {totalCount.toLocaleString()} products
              </span>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-[0.25rem] min-w-[200px] h-[44px] px-[2rem] font-body text-[0.9375rem] font-medium text-gold-dark bg-white border-[1.5px] border-gold rounded-full cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-gold hover:not-disabled:text-white disabled:opacity-70 disabled:cursor-wait"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="inline-block w-[16px] h-[16px] border-[2px] border-current border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
              <div className="w-[200px] h-[3px] bg-border rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-gold rounded-[2px] transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min((products.length / totalCount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t-[4px] border-gold">
        <div className="max-w-[1280px] mx-auto px-[2rem] pt-[4rem] pb-[3rem] grid grid-cols-[1fr_2fr] gap-[4rem] max-md:grid-cols-1">
          <div className="max-w-[280px]">
            <span className="font-display text-[1.5rem] font-semibold text-gold-dark tracking-[-0.03em]">Vibe</span>
            <p className="text-[0.875rem] text-muted mt-[0.5rem] leading-[1.6]">
              The marketplace for handcrafted &amp; artisan goods.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-[2rem] max-sm:grid-cols-2">
            <div className="flex flex-col gap-[0.5rem]">
              <h4 className="font-body text-[0.8125rem] font-semibold tracking-[0.05em] uppercase text-charcoal mb-[0.25rem]">Shop</h4>
              {CATEGORIES.slice(0, 4).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className="text-[0.875rem] text-slate text-left bg-none border-none cursor-pointer font-body p-0 transition-colors duration-[200ms] hover:text-gold-dark"
                  onClick={() => { setActiveCategory(c.code); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-[0.5rem]">
              <h4 className="font-body text-[0.8125rem] font-semibold tracking-[0.05em] uppercase text-charcoal mb-[0.25rem]">Company</h4>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">About Us</a>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Careers</a>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Blog</a>
            </div>
            <div className="flex flex-col gap-[0.5rem]">
              <h4 className="font-body text-[0.8125rem] font-semibold tracking-[0.05em] uppercase text-charcoal mb-[0.25rem]">Support</h4>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Help Center</a>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Shipping</a>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Returns</a>
              <a href="#" className="text-[0.875rem] text-slate transition-colors duration-[200ms] hover:text-gold-dark">Contact</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-[2rem] py-[1.5rem] border-t border-border-light max-sm:px-[1rem] max-sm:py-[1rem]">
          <p className="text-[0.8125rem] text-muted">&copy; 2026 Vibe. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
