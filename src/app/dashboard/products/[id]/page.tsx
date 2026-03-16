'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProductById, formatPrice } from '@/lib/products';
import { useCart } from '@/hooks/use-cart';
import styles from './detail.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const product = getProductById(params.id as string);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showAdded, setShowAdded] = useState(false);

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2 className={styles.notFoundTitle}>Product not found</h2>
        <p className={styles.notFoundDesc}>
          The product you are looking for does not exist or has been removed.
        </p>
        <Link href="/dashboard/products" className={styles.notFoundLink}>
          ← Back to Products
        </Link>
      </div>
    );
  }

  const effectivePrice = product.salePrice ?? product.price;
  const savings = product.salePrice ? product.price - product.salePrice : 0;
  const stockStatus =
    product.stock > 10 ? 'inStock' : product.stock > 0 ? 'lowStock' : 'out';

  const handleAddToCart = () => {
    addItem(product, quantity);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 2000);
  };

  return (
    <div>
      <Link href="/dashboard/products" className={styles.backLink}>
        ← Back to Products
      </Link>

      <div className={styles.detail}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            {product.salePrice !== null && (
              <span className={styles.saleBadge}>Sale</span>
            )}
          </div>
          <div className={styles.thumbnails}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.thumbnail} />
            ))}
          </div>
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
              <span className={styles.ratingStar}>★</span>
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
              className={`${styles.stockDot} ${stockStatus === 'inStock' ? styles.inStock : styles.lowStock}`}
            />
            <span className={styles.stockText}>
              {stockStatus === 'inStock'
                ? `${product.stock} in stock`
                : stockStatus === 'lowStock'
                  ? `Only ${product.stock} left`
                  : 'Out of stock'}
            </span>
          </div>

          {/* Quantity */}
          <div className={styles.quantityRow}>
            <div className={styles.quantityControl}>
              <button
                type="button"
                className={styles.quantityBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
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

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
            >
              Add to Cart — {formatPrice(effectivePrice * quantity)}
            </button>
            <button type="button" className={styles.wishlistBtn}>
              ♡
            </button>
          </div>

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

      {/* Added to cart feedback */}
      {showAdded && (
        <div className={styles.addedFeedback}>
          Added {quantity} item{quantity > 1 ? 's' : ''} to cart
        </div>
      )}
    </div>
  );
}
