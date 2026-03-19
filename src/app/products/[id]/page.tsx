'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isLoggedIn, getUser, logout as authLogout, type UserInfo } from '@/lib/auth';
import { fetchProductById, formatPrice, getCategoryLabel, type Product } from '@/lib/products';
import { useCart } from '@/hooks/use-cart';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { ToastContainer, showToast } from '@/components/toast/Toast';
import styles from './product-detail.module.css';

export default function PublicProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { addItem: cartAddItem, totalItems: cartCount } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('login');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    fetchProductById(productId)
      .then((p) => {
        setProduct(p);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [productId]);

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

  function handleAddToCart() {
    if (!product) return;
    const result = cartAddItem(product);
    if (result.success) {
      showToast(result.message);
    } else {
      showToast(result.message, 'error');
    }
  }

  // Collect all images for gallery
  const allImages: string[] = [];
  if (product) {
    if (product.imageUrl) allImages.push(product.imageUrl);
    if (product.images) {
      for (const img of product.images) {
        if (img && !allImages.includes(img)) allImages.push(img);
      }
    }
  }

  return (
    <div className={styles.page}>
      {/* Top Bar */}
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

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            Vibe
          </Link>

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        onSuccess={refreshAuth}
      />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Back Link */}
          <Link href="/" className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Store
          </Link>

          {/* Loading */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading product...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className={styles.errorState}>
              <p>{error}</p>
              <Link href="/" className={styles.errorBtn}>
                Back to Store
              </Link>
            </div>
          )}

          {/* Product Detail */}
          {product && !loading && !error && (
            <div className={styles.detail}>
              {/* Image Gallery */}
              <div className={styles.gallery}>
                <div className={styles.mainImage}>
                  {allImages.length > 0 ? (
                    <img
                      src={allImages[selectedImage] || allImages[0]}
                      alt={product.name}
                      className={styles.mainImg}
                    />
                  ) : (
                    <div className={styles.noImage}>No Image</div>
                  )}
                  {product.salePrice !== null && (
                    <span className={styles.saleBadge}>
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </span>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className={styles.thumbnails}>
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.thumbnail} ${idx === selectedImage ? styles.thumbnailActive : ''}`}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className={styles.thumbImg} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className={styles.info}>
                <span className={styles.categoryTag}>{getCategoryLabel(product.category)}</span>
                <h1 className={styles.productName}>{product.name}</h1>

                <div className={styles.ratingRow}>
                  <span className={styles.star}>&#9733;</span>
                  <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
                  <span className={styles.reviewCount}>({product.reviewCount} reviews)</span>
                  <span className={styles.soldCount}>{product.sold} sold</span>
                </div>

                <div className={styles.priceSection}>
                  <span className={styles.price}>
                    {formatPrice(product.salePrice ?? product.price)}
                  </span>
                  {product.salePrice !== null && (
                    <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                  )}
                </div>

                <p className={styles.description}>{product.description}</p>

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Seller</span>
                    <span className={styles.metaValue}>{product.seller?.name || 'Unknown'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Stock</span>
                    <span className={`${styles.metaValue} ${product.stock <= 0 ? styles.outOfStock : ''}`}>
                      {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className={styles.tags}>
                    {product.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerLogo}>Vibe</span>
          <p>&copy; 2026 Vibe. All rights reserved.</p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
