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
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-charcoal text-white/70 text-[0.75rem] max-sm:hidden">
        <div className="max-w-[1280px] mx-auto py-[0.5rem] px-[2rem] flex items-center justify-between">
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
                <button type="button" className="bg-none border-none text-white/70 font-body text-[0.75rem] cursor-pointer transition-colors duration-[200ms] p-0 hover:text-white" onClick={openSignup}>
                  Sign Up
                </button>
                <span className="opacity-30">|</span>
                <button type="button" className="bg-none border-none text-white/70 font-body text-[0.75rem] cursor-pointer transition-colors duration-[200ms] p-0 hover:text-white" onClick={openLogin}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-100 bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto py-[0.75rem] px-[2rem] flex items-center justify-between max-sm:px-[1rem] max-sm:py-[0.625rem]">
          <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] shrink-0 max-sm:text-[1.375rem]">
            Vibe
          </Link>

          <div className="flex items-center gap-[1rem] shrink-0 max-[479px]:gap-[0.5rem]">
            <Link href="/cart" className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-transparent border-none text-charcoal cursor-pointer transition-all duration-[200ms] hover:bg-ivory hover:text-gold-dark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-[2px] right-0 min-w-[18px] h-[18px] px-[5px] flex items-center justify-center text-[0.625rem] font-bold text-white bg-error rounded-[9px] leading-none pointer-events-none">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>
            {loggedIn && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <button type="button" className="relative flex items-center justify-center w-[40px] h-[40px] rounded-[8px] bg-transparent border-none text-charcoal cursor-pointer transition-all duration-[200ms] hover:bg-ivory hover:text-gold-dark" onClick={openLogin}>
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
      <main className="flex-1 bg-ivory py-[2rem] pb-[4rem]">
        <div className="max-w-[1280px] mx-auto px-[2rem] max-sm:px-[1rem]">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center gap-[0.5rem] font-body text-[0.875rem] text-slate no-underline mb-[2rem] transition-colors duration-[200ms] hover:text-gold-dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Store
          </Link>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
              <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
              <p>Loading product...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-[4rem] px-[2rem] text-error text-[0.9375rem]">
              <p>{error}</p>
              <Link href="/" className="inline-block mt-[1.5rem] py-[0.625rem] px-[1.5rem] bg-charcoal text-white rounded-[8px] font-body text-[0.875rem] font-medium no-underline transition-colors duration-[200ms] hover:bg-charcoal-light">
                Back to Store
              </Link>
            </div>
          )}

          {/* Product Detail */}
          {product && !loading && !error && (
            <div className="grid grid-cols-2 gap-[4rem] bg-white rounded-[12px] border border-border-light p-[3rem] max-md:gap-[3rem] max-md:p-[2rem] max-sm:grid-cols-1 max-sm:gap-[2rem] max-sm:p-[1.5rem]">
              {/* Image Gallery */}
              <div className="flex flex-col gap-[1rem]">
                <div className="aspect-square bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] rounded-[12px] overflow-hidden relative">
                  {allImages.length > 0 ? (
                    <img
                      src={allImages[selectedImage] || allImages[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[1rem] text-muted">No Image</div>
                  )}
                  {product.salePrice !== null && (
                    <span className="absolute top-[1rem] left-[1rem] bg-error text-white text-[0.8125rem] font-bold py-[6px] px-[12px] rounded-[8px]">
                      {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                    </span>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-[0.5rem] overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`w-[64px] h-[64px] rounded-[8px] overflow-hidden border-2 cursor-pointer shrink-0 p-0 bg-none transition-colors duration-[200ms] hover:border-gold max-[479px]:w-[52px] max-[479px]:h-[52px] ${idx === selectedImage ? 'border-gold-dark' : 'border-border-light'}`}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover block" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <span className="inline-block w-fit text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] bg-[rgba(200,169,110,0.12)] text-gold-dark tracking-[0.02em] uppercase mb-[1rem]">{getCategoryLabel(product.category)}</span>
                <h1 className="font-display text-[1.75rem] font-normal text-charcoal leading-[1.3] tracking-[-0.02em] mb-[1rem] max-md:text-[1.5rem] max-sm:text-[1.375rem]">{product.name}</h1>

                <div className="flex items-center gap-[0.5rem] mb-[1.5rem] text-[0.875rem] text-slate max-sm:flex-wrap">
                  <span className="text-gold text-[1rem]">&#9733;</span>
                  <span className="font-medium text-charcoal">{product.rating.toFixed(1)}</span>
                  <span className="text-muted">({product.reviewCount} reviews)</span>
                  <span className="text-muted ml-[0.5rem] pl-[1rem] border-l border-border max-sm:ml-0 max-sm:pl-0 max-sm:border-l-0">{product.sold} sold</span>
                </div>

                <div className="flex items-baseline gap-[1rem] mb-[2rem] p-[1.5rem] bg-ivory rounded-[8px] max-[479px]:p-[1rem]">
                  <span className="font-display text-[2rem] font-medium text-error tracking-[-0.02em] max-md:text-[1.75rem] max-sm:text-[1.5rem]">
                    {formatPrice(product.salePrice ?? product.price)}
                  </span>
                  {product.salePrice !== null && (
                    <span className="text-[1rem] text-muted line-through">{formatPrice(product.price)}</span>
                  )}
                </div>

                <p className="text-[0.9375rem] text-slate leading-[1.7] mb-[2rem]">{product.description}</p>

                <div className="grid grid-cols-2 gap-[1rem] mb-[2rem] max-sm:grid-cols-1">
                  <div className="flex flex-col gap-[4px] p-[1rem] bg-ivory rounded-[8px]">
                    <span className="text-[0.75rem] font-medium text-muted uppercase tracking-[0.05em]">Seller</span>
                    <span className="text-[0.9375rem] font-medium text-charcoal">{product.seller?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col gap-[4px] p-[1rem] bg-ivory rounded-[8px]">
                    <span className="text-[0.75rem] font-medium text-muted uppercase tracking-[0.05em]">Stock</span>
                    <span className={`text-[0.9375rem] font-medium ${product.stock <= 0 ? 'text-error' : 'text-charcoal'}`}>
                      {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-[0.5rem] mb-[2rem]">
                    {product.tags.map((tag) => (
                      <span key={tag} className="text-[0.75rem] py-[4px] px-[12px] bg-ivory-warm text-slate rounded-[100px] border border-border-light">{tag}</span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="w-full p-[1rem] font-body text-[1rem] font-semibold text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] mt-auto hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-[1px] hover:not-disabled:shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
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
      <footer className="bg-white border-t-4 border-gold">
        <div className="max-w-[1280px] mx-auto py-[2rem] px-[2rem] flex items-center justify-between max-sm:flex-col max-sm:gap-[0.5rem] max-sm:text-center">
          <span className="font-display text-[1.25rem] font-semibold text-gold-dark tracking-[-0.03em]">Vibe</span>
          <p className="text-[0.8125rem] text-muted">&copy; 2026 Vibe. All rights reserved.</p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
