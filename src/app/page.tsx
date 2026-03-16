'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { PRODUCTS, CATEGORIES, getOnSaleProducts, formatPrice, type Product } from '@/lib/products';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { UserMenu } from '@/components/user-menu/UserMenu';
import styles from './page.module.css';

const ITEMS_PER_PAGE = 8;

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');

  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sort, setSort] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

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

  // Filter & sort products
  const filtered = useMemo(() => {
    let result = [...PRODUCTS];

    // Category filter
    if (activeCategory !== 'ALL') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.seller.name.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case 'popular':
        result.sort((a, b) => b.sold - a.sold);
        break;
      case 'newest':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'price-low':
        result.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [activeCategory, search, sort]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, sort]);

  const saleProducts = getOnSaleProducts();

  function getProductHref(product: Product) {
    return loggedIn ? `/dashboard/products/${product.id}` : '#';
  }

  function handleProductClick(e: React.MouseEvent, product: Product) {
    if (!loggedIn) {
      e.preventDefault();
      openLogin();
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
          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for products, brands, and more..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className={styles.searchBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* Cart + User */}
          <div className={styles.headerActions}>
            {loggedIn ? (
              <>
                <Link href="/dashboard/cart" className={styles.cartBtn}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </Link>
                <UserMenu user={user!} onLogout={handleLogout} />
              </>
            ) : (
              <button type="button" className={styles.cartBtn} onClick={openLogin}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
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

      {/* ── Flash Deals Banner ── */}
      {saleProducts.length > 0 && activeCategory === 'ALL' && !search && (
        <section className={styles.flashSection}>
          <div className={styles.flashInner}>
            <div className={styles.flashHeader}>
              <div className={styles.flashTitle}>
                <span className={styles.flashIcon}>⚡</span>
                Flash Deals
              </div>
              <Link
                href={loggedIn ? '/dashboard/products' : '#'}
                onClick={(e) => { if (!loggedIn) { e.preventDefault(); openLogin(); } }}
                className={styles.flashSeeAll}
              >
                See All &rarr;
              </Link>
            </div>
            <div className={styles.flashGrid}>
              {saleProducts.map((product) => (
                <Link
                  key={product.id}
                  href={getProductHref(product)}
                  onClick={(e) => handleProductClick(e, product)}
                  className={styles.flashCard}
                >
                  <div className={styles.flashCardImage}>
                    <span className={styles.flashBadge}>{getDiscount(product)}% OFF</span>
                  </div>
                  <div className={styles.flashCardBody}>
                    <p className={styles.flashPrice}>{formatPrice(product.salePrice!)}</p>
                    <p className={styles.flashOriginal}>{formatPrice(product.price)}</p>
                    <div className={styles.flashSoldBar}>
                      <div
                        className={styles.flashSoldFill}
                        style={{ width: `${Math.min((product.sold / (product.sold + product.stock)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className={styles.flashSoldText}>{product.sold} sold</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Product Grid ── */}
      <section className={styles.shopSection}>
        <div className={styles.shopInner}>
          {/* Sort Bar */}
          <div className={styles.sortBar}>
            <div className={styles.sortLeft}>
              <span className={styles.resultCount}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
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
                <Link
                  key={product.id}
                  href={getProductHref(product)}
                  onClick={(e) => handleProductClick(e, product)}
                  className={styles.productCard}
                >
                  <div className={styles.productImage}>
                    {product.salePrice !== null && (
                      <span className={styles.saleBadge}>{getDiscount(product)}%</span>
                    )}
                  </div>
                  <div className={styles.productBody}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productSeller}>{product.seller.name}</p>
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
                        <span className={styles.star}>★</span> {product.rating}
                      </span>
                      <span className={styles.productSold}>{product.sold} sold</span>
                    </div>
                  </div>
                </Link>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
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
    </div>
  );
}
