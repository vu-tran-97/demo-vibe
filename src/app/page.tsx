'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { CATEGORIES, fetchProducts, formatPrice, type Product } from '@/lib/products';
import { useCart } from '@/hooks/use-cart';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { ToastContainer, showToast } from '@/components/toast/Toast';
import styles from './page.module.css';

const ITEMS_PER_PAGE = 8;
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
  const router = useRouter();
  const { addItem: cartAddItem, totalItems: cartCount } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');
  const [headerSearch, setHeaderSearch] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sort, setSort] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

  // Fetch products when filters change
  useEffect(() => {
    setLoading(true);
    const sortMap: Record<SortOption, string> = {
      popular: 'popular',
      newest: 'newest',
      'price-low': 'price-low',
      'price-high': 'price-high',
      rating: 'rating',
    };
    fetchProducts({
      page,
      limit: ITEMS_PER_PAGE,
      category: activeCategory !== 'ALL' ? activeCategory : undefined,
      search: search.trim() || undefined,
      sort: sortMap[sort],
    })
      .then((res) => {
        setProducts(res.items);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(1);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [page, activeCategory, search, sort]);

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
    if (loggedIn) {
      const searchBase = user?.role === 'BUYER' ? '/products' : '/dashboard/search';
      router.push(`${searchBase}?q=${encodeURIComponent(trimmed)}`);
    } else {
      // For non-logged-in users, filter products on the home page
      setSearch(trimmed);
    }
  }

  function handleHeaderSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleHeaderSearch(e);
    }
  }

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, sort]);

  const paged = products;

  function getProductHref(product: Product) {
    return `/products/${product.id}`;
  }

  function handleProductClick(_e: React.MouseEvent, _product: Product) {
    // Public product page is accessible to all users
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
    <div className={styles.page}>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarLinks}>
            <span>Download App</span>
            <span className={styles.topBarDivider}>|</span>
            <span>Help Center</span>
          </div>
          <div className={styles.topBarLinks}>
            {loggedIn ? (
              <span>Welcome, {user?.nickname || user?.name}!</span>
            ) : (
              <>
                <button type="button" className={styles.topBarBtn} onClick={openSignup}>
                  Sign Up
                </button>
                <span className={styles.topBarDivider}>|</span>
                <button type="button" className={styles.topBarBtn} onClick={openLogin}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            Vibe
          </Link>

          {/* Search */}
          <form className={styles.searchWrapper} onSubmit={handleHeaderSearch}>
            <input
              type="text"
              className={styles.searchInput}
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
            <button type="submit" className={styles.searchBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>

          {/* Cart + User */}
          <div className={styles.headerActions}>
            <Link href="/cart" className={styles.cartBtn}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>
            {loggedIn && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <button type="button" className={styles.cartBtn} onClick={openLogin}>
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
      <nav className={styles.categoryBar}>
        <div className={styles.categoryBarInner}>
          <button
            type="button"
            className={`${styles.categoryChip} ${activeCategory === 'ALL' ? styles.categoryActive : ''}`}
            onClick={() => setActiveCategory('ALL')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`${styles.categoryChip} ${activeCategory === cat.code ? styles.categoryActive : ''}`}
              onClick={() => setActiveCategory(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Hero Banner Carousel ── */}
      <section className={styles.bannerSection}>
        <div className={styles.bannerInner}>
          <div className={styles.bannerTrack} style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
            {BANNER_SLIDES.map((slide, i) => (
              <div key={i} className={styles.bannerSlide}>
                <img src={slide.image} alt={slide.title} className={styles.bannerImage} />
                <div className={styles.bannerOverlay}>
                  <h2 className={styles.bannerTitle}>{slide.title}</h2>
                  <p className={styles.bannerSubtitle}>{slide.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.bannerDots}>
            {BANNER_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.bannerDot} ${i === bannerIndex ? styles.bannerDotActive : ''}`}
                onClick={() => setBannerIndex(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Grid ── */}
      <section className={styles.shopSection}>
        <div className={styles.shopInner}>
          {/* Sort Bar */}
          <div className={styles.sortBar}>
            <div className={styles.sortLeft}>
              <span className={styles.resultCount}>
                {totalCount} product{totalCount !== 1 ? 's' : ''}
                {activeCategory !== 'ALL' && (
                  <> in <strong>{CATEGORIES.find((c) => c.code === activeCategory)?.label}</strong></>
                )}
                {search && (
                  <> matching &ldquo;<strong>{search}</strong>&rdquo;</>
                )}
              </span>
            </div>
            <div className={styles.sortRight}>
              <span className={styles.sortLabel}>Sort by:</span>
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
                  className={`${styles.sortBtn} ${sort === opt.value ? styles.sortActive : ''}`}
                  onClick={() => setSort(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {paged.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No products found</h3>
              <p className={styles.emptyDesc}>
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <button
                type="button"
                className={styles.emptyBtn}
                onClick={() => { setSearch(''); setActiveCategory('ALL'); }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {paged.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <Link
                    href={getProductHref(product)}
                    onClick={(e) => handleProductClick(e, product)}
                    className={styles.productCardLink}
                  >
                    <div className={styles.productImage}>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className={styles.cardImg} />
                      )}
                      {product.salePrice !== null && (
                        <span className={styles.saleBadge}>{getDiscount(product)}%</span>
                      )}
                    </div>
                    <div className={styles.productBody}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productSeller}>{product.seller?.name || 'Unknown Seller'}</p>
                      <div className={styles.productPricing}>
                        <span className={styles.productPrice}>
                          {formatPrice(product.salePrice ?? product.price)}
                        </span>
                        {product.salePrice !== null && (
                          <span className={styles.productOriginal}>
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <div className={styles.productMeta}>
                        <span className={styles.productRating}>
                          <span className={styles.star}>&#9733;</span> {product.rating}
                        </span>
                        <span className={styles.productSold}>{product.sold} sold</span>
                      </div>
                    </div>
                  </Link>
                  {product.stock > 0 && (
                    <button
                      type="button"
                      className={styles.quickAddBtn}
                      onClick={(e) => handleQuickAdd(e, product)}
                    >
                      + Add to Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                &lsaquo;
              </button>
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push('...');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className={styles.pageDots}>&hellip;</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Vibe</span>
            <p className={styles.footerTagline}>
              The marketplace for handcrafted &amp; artisan goods.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Shop</h4>
              {CATEGORIES.slice(0, 4).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={styles.footerLink}
                  onClick={() => { setActiveCategory(c.code); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerColTitle}>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Shipping</a>
              <a href="#">Returns</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Vibe. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
