'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchProductById, deleteProduct, formatPrice, type Product } from '@/lib/products';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { showToast } from '@/components/toast/Toast';
import styles from './detail.module.css';

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
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.notFound}>
        <h2 className={styles.notFoundTitle}>Product not found</h2>
        <p className={styles.notFoundDesc}>
          {error || 'The product you are looking for does not exist or has been removed.'}
        </p>
        <Link href="/dashboard/products" className={styles.notFoundLink}>
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

  return (
    <div>
      <Link href="/dashboard/products" className={styles.backLink}>
        &#8592; Back to Products
      </Link>

      <div className={styles.detail}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className={styles.mainImg} />
            )}
            {product.salePrice !== null && (
              <span className={styles.saleBadge}>Sale</span>
            )}
            {product.status && product.status !== 'ACTIVE' && (
              <span className={styles.statusBadge} data-status={product.status}>
                {STATUS_LABELS[product.status] || product.status}
              </span>
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className={styles.thumbnails}>
              {product.images.map((img, i) => (
                <div key={i} className={styles.thumbnail}>
                  <img src={img} alt={`${product.name} ${i + 1}`} className={styles.thumbImg} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          <p className={styles.breadcrumb}>
            <Link
              href="/dashboard/products"
              className={styles.breadcrumbLink}
            >
              Products
            </Link>{' '}
            / {product.categoryLabel}
          </p>

          <h1 className={styles.productName}>{product.name}</h1>

          <div className={styles.sellerRow}>
            <span className={styles.sellerName}>
              by {product.seller.name}
            </span>
            <span className={styles.sellerDot} />
            <span className={styles.ratingDisplay}>
              <span className={styles.ratingStar}>&#9733;</span>
              {product.rating}
              <span className={styles.reviewCount}>
                ({product.reviewCount} reviews)
              </span>
            </span>
          </div>

          {/* Price */}
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>
              {formatPrice(effectivePrice)}
            </span>
            {product.salePrice !== null && (
              <>
                <span className={styles.originalPrice}>
                  {formatPrice(product.price)}
                </span>
                <span className={styles.savingsTag}>
                  Save {formatPrice(savings)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className={styles.description}>{product.description}</p>

          {/* Tags */}
          <div className={styles.tags}>
            {product.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>

          {/* Stock */}
          <div className={styles.stockInfo}>
            <span
              className={`${styles.stockDot} ${stockStatus === 'inStock' ? styles.inStock : stockStatus === 'lowStock' ? styles.lowStock : styles.outOfStock}`}
            />
            <span className={styles.stockText}>
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
              <div className={styles.quantityRow}>
                <div className={styles.quantityControl}>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    &#8722;
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.quantityBtn}
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                >
                  Add to Cart &#8212; {formatPrice(effectivePrice * quantity)}
                </button>
                <button type="button" className={styles.wishlistBtn}>
                  &#9825;
                </button>
              </div>
            </>
          )}

          {/* Owner/Admin Actions */}
          {isOwnerOrAdmin && (
            <div className={styles.ownerActions}>
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                className={styles.editBtn}
              >
                Edit Product
              </Link>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          )}

          {/* Stats */}
          <div className={styles.productStats}>
            <div className={styles.stat}>
              <p className={styles.statValue}>{product.sold}</p>
              <p className={styles.statLabel}>Sold</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{product.views.toLocaleString()}</p>
              <p className={styles.statLabel}>Views</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{product.reviewCount}</p>
              <p className={styles.statLabel}>Reviews</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
