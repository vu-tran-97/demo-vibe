'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchProductById, deleteProduct, formatPrice, type Product } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { showToast } from '@/components/toast/Toast';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SOLD_OUT: 'Sold Out',
  HIDDEN: 'Hidden',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(false);
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deleting, setDeleting] = useState(false);

  const isOwnerOrAdmin =
    user &&
    (user.role === 'SUPER_ADMIN' ||
      (user.role === 'SELLER' && product?.seller?.id === user.id));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProductById(params.id as string);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
        <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-[8rem] px-[2rem]">
        <h2 className="font-display text-[2rem] text-charcoal mb-[1rem]">Product not found</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          {error || 'The product you are looking for does not exist or has been removed.'}
        </p>
        <Link href="/dashboard/products" className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-200 hover:text-gold">
          &#8592; Back to Products
        </Link>
      </div>
    );
  }

  const effectivePrice = product.salePrice ?? product.price;
  const savings = product.salePrice ? product.price - product.salePrice : 0;
  const stockStatus =
    product.stock > 10 ? 'inStock' : product.stock > 0 ? 'lowStock' : 'out';

  const handleAddToCart = () => {
    const result = addItem(product, quantity);
    if (result.success) {
      showToast(result.message);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push('/dashboard/products/my');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleting(false);
    }
  };

  const statusBgClass =
    product.status === 'DRAFT'
      ? 'bg-muted'
      : product.status === 'SOLD_OUT'
        ? 'bg-error'
        : 'bg-slate';

  return (
    <div>
      <Link href="/dashboard/products" className="inline-flex items-center gap-[0.5rem] text-[0.8125rem] text-slate mb-[2rem] transition-colors duration-200 hover:text-charcoal">
        &#8592; Back to Products
      </Link>

      <div className="grid grid-cols-2 gap-[4rem] animate-fade-in max-md:grid-cols-1 max-md:gap-[3rem]">
        {/* Image Section */}
        <div className="relative">
          <div className="aspect-square bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] rounded-[16px] overflow-hidden relative">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
            )}
            {product.salePrice !== null && (
              <span className="absolute top-[1.5rem] left-[1.5rem] py-[6px] px-[14px] text-[0.75rem] font-semibold tracking-[0.08em] uppercase text-white bg-error rounded-[4px] z-[1]">Sale</span>
            )}
            {product.status && product.status !== 'ACTIVE' && (
              <span className={`absolute top-[1.5rem] right-[1.5rem] py-[6px] px-[14px] text-[0.75rem] font-semibold tracking-[0.08em] uppercase text-white rounded-[4px] z-[1] ${statusBgClass}`}>
                {STATUS_LABELS[product.status] || product.status}
              </span>
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="flex gap-[1rem] mt-[1rem] max-sm:overflow-x-auto">
              {product.images.map((img, i) => (
                <div key={i} className="w-[72px] h-[72px] rounded-[8px] bg-[linear-gradient(145deg,#E8E4DE,#D4CFC6)] border-[2px] border-border-light cursor-pointer transition-colors duration-200 first:border-charcoal hover:border-charcoal overflow-hidden">
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <p className="text-[0.75rem] text-muted mb-[0.5rem] tracking-[0.02em]">
            <Link
              href="/dashboard/products"
              className="text-gold transition-colors duration-200 hover:text-gold-dark"
            >
              Products
            </Link>{' '}
            / {product.categoryLabel}
          </p>

          <h1 className="font-display text-[2rem] font-normal text-charcoal leading-[1.2] mb-[1rem] max-sm:text-[1.5rem]">{product.name}</h1>

          <div className="flex items-center gap-[0.5rem] mb-[1.5rem]">
            <span className="text-[0.875rem] text-slate">
              by {product.seller.name}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-border" />
            <span className="flex items-center gap-[4px] text-[0.875rem] text-slate">
              <span className="text-gold">&#9733;</span>
              {product.rating}
              <span className="text-muted">
                ({product.reviewCount} reviews)
              </span>
            </span>
          </div>

          {/* Price */}
          <div className="py-[1.5rem] border-t border-b border-border-light mb-[2rem]">
            <span className="font-display text-[2rem] font-medium text-charcoal max-sm:text-[1.5rem]">
              {formatPrice(effectivePrice)}
            </span>
            {product.salePrice !== null && (
              <>
                <span className="text-[1.125rem] text-muted line-through ml-[1rem]">
                  {formatPrice(product.price)}
                </span>
                <span className="inline-block text-[0.75rem] font-semibold text-error bg-[rgba(196,91,91,0.08)] py-[3px] px-[10px] rounded-[4px] ml-[1rem]">
                  Save {formatPrice(savings)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-[0.9375rem] text-slate leading-[1.8] mb-[2rem]">{product.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-[0.5rem] mb-[2rem]">
            {product.tags.map((tag) => (
              <span key={tag} className="text-[0.75rem] text-slate bg-ivory-warm py-[4px] px-[12px] rounded-[4px]">
                {tag}
              </span>
            ))}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-[0.5rem] text-[0.8125rem] mb-[2rem]">
            <span
              className={`w-[8px] h-[8px] rounded-full ${stockStatus === 'inStock' ? 'bg-success' : stockStatus === 'lowStock' ? 'bg-gold' : 'bg-error'}`}
            />
            <span className="text-slate">
              {stockStatus === 'inStock'
                ? `${product.stock} in stock`
                : stockStatus === 'lowStock'
                  ? `Only ${product.stock} left`
                  : 'Out of stock'}
            </span>
          </div>

          {/* Quantity & Add to Cart (for buyers) */}
          {product.stock > 0 && (
            <>
              <div className="flex items-center gap-[1.5rem] mb-[2rem]">
                <div className="flex items-center border border-border rounded-[8px] overflow-hidden">
                  <button
                    type="button"
                    className="w-[40px] h-[40px] flex items-center justify-center text-[1.125rem] text-slate bg-white border-none cursor-pointer transition-all duration-200 hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    &#8722;
                  </button>
                  <span className="w-[48px] text-center text-[0.9375rem] font-medium text-charcoal border-l border-r border-border-light py-[0.5rem]">{quantity}</span>
                  <button
                    type="button"
                    className="w-[40px] h-[40px] flex items-center justify-center text-[1.125rem] text-slate bg-white border-none cursor-pointer transition-all duration-200 hover:bg-ivory hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-[1rem] max-sm:flex-col">
                <button
                  type="button"
                  className="flex-1 py-[0.875rem] px-[2rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-200 hover:bg-charcoal-light hover:-translate-y-[2px] hover:shadow-medium"
                  onClick={handleAddToCart}
                >
                  Add to Cart &#8212; {formatPrice(effectivePrice * quantity)}
                </button>
                <button type="button" className="w-[48px] h-[48px] flex items-center justify-center text-[1.25rem] text-slate bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-error hover:text-error max-sm:w-full">
                  &#9825;
                </button>
              </div>
            </>
          )}

          {/* Owner/Admin Actions */}
          {isOwnerOrAdmin && (
            <div className="flex gap-[1rem] mt-[2rem] pt-[2rem] border-t border-border-light max-sm:flex-col">
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                className="flex-1 py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-200 text-center no-underline hover:border-charcoal hover:bg-ivory"
              >
                Edit Product
              </Link>
              <button
                type="button"
                className="py-[0.75rem] px-[1.5rem] font-body text-[0.875rem] font-medium text-error bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-error hover:bg-[rgba(196,91,91,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-[2rem] mt-[2rem] pt-[2rem] border-t border-border-light">
            <div className="text-center">
              <p className="font-display text-[1.25rem] font-medium text-charcoal">{product.sold}</p>
              <p className="text-[0.75rem] text-muted mt-[2px]">Sold</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.25rem] font-medium text-charcoal">{product.views.toLocaleString()}</p>
              <p className="text-[0.75rem] text-muted mt-[2px]">Views</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[1.25rem] font-medium text-charcoal">{product.reviewCount}</p>
              <p className="text-[0.75rem] text-muted mt-[2px]">Reviews</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
