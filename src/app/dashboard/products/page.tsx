'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PRODUCTS,
  CATEGORIES,
  formatPrice,
  type Product,
} from '@/lib/products';
import styles from './products.module.css';

type SortOption = 'popular' | 'newest' | 'price-low' | 'price-high' | 'rating';

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filteredProducts = useMemo(() => {
    let items: Product[] = activeCategory
      ? PRODUCTS.filter((p) => p.category === activeCategory)
      : [...PRODUCTS];

    switch (sortBy) {
      case 'popular':
        items.sort((a, b) => b.sold - a.sold);
        break;
      case 'newest':
        items.sort((a, b) => b.views - a.views);
        break;
      case 'price-low':
        items.sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
        );
        break;
      case 'price-high':
        items.sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
        );
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
    }

    return items;
  }, [activeCategory, sortBy]);

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Products</h2>
          <p className={styles.pageSubtitle}>
            {filteredProducts.length} items available
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.categoryFilters}>
          <button
            type="button"
            className={`${styles.categoryBtn} ${activeCategory === null ? styles.categoryBtnActive : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`${styles.categoryBtn} ${activeCategory === cat.code ? styles.categoryBtnActive : ''}`}
              onClick={() => setActiveCategory(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Most Viewed</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/products/${product.id}`}
              className={styles.productCard}
            >
              <div className={styles.productImage}>
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
                    <span className={styles.ratingStar}>★</span>
                    {product.rating}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <h3 className={styles.emptyTitle}>No products found</h3>
          <p className={styles.emptyDesc}>
            Try selecting a different category.
          </p>
        </div>
      )}
    </div>
  );
}
