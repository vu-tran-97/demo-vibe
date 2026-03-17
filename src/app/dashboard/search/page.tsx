'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchSearchResults,
  addRecentSearch,
  type SearchProduct,
  type SearchPost,
} from '@/lib/search';
import { formatPrice } from '@/lib/products';
import styles from './search.module.css';

type Tab = 'products' | 'posts';

const CATEGORY_LABELS: Record<string, string> = {
  CERAMICS: 'Ceramics & Pottery',
  TEXTILES: 'Textiles & Fabrics',
  ART: 'Art & Prints',
  JEWELRY: 'Jewelry & Accessories',
  HOME: 'Home & Living',
  FOOD: 'Food & Beverages',
  NOTICE: 'Notice',
  FREE: 'Free Board',
  QNA: 'Q&A',
  REVIEW: 'Reviews',
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [postTotal, setPostTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async () => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSearchResults(query);
      setProducts(result.products.items);
      setProductTotal(result.products.total);
      setPosts(result.posts.items);
      setPostTotal(result.posts.total);
      addRecentSearch(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  if (!query || query.length < 2) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>Search for products and posts</h3>
          <p className={styles.emptyDesc}>Enter at least 2 characters to search across the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Search results for &ldquo;<span className={styles.queryHighlight}>{query}</span>&rdquo;
        </h2>
        <p className={styles.subtitle}>
          {productTotal + postTotal} results found
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'products' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products ({productTotal})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({postTotal})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Searching...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={doSearch}>
            Retry
          </button>
        </div>
      )}

      {/* Products Tab */}
      {!loading && !error && activeTab === 'products' && (
        <>
          {products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/dashboard/products/${product.id}`}
                  className={styles.productCard}
                >
                  <div className={styles.productImage}>
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
                    )}
                    {product.salePrice !== null && (
                      <span className={styles.saleBadge}>Sale</span>
                    )}
                  </div>
                  <div className={styles.productBody}>
                    <p className={styles.productCategory}>
                      {CATEGORY_LABELS[product.category] || product.category}
                    </p>
                    <h3 className={styles.productName}>{product.name}</h3>
                    {product.seller && (
                      <p className={styles.productSeller}>by {product.seller.name}</p>
                    )}
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
                        <span className={styles.ratingStar}>&#9733;</span>
                        {product.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>&#9671;</div>
              <h3 className={styles.emptyTitle}>No products found</h3>
              <p className={styles.emptyDesc}>Try a different search term or browse all products.</p>
            </div>
          )}
        </>
      )}

      {/* Posts Tab */}
      {!loading && !error && activeTab === 'posts' && (
        <>
          {posts.length > 0 ? (
            <div className={styles.postList}>
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/board/${post.id}`}
                  className={styles.postCard}
                >
                  <div className={styles.postTop}>
                    <span className={styles.postCategoryBadge}>
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className={styles.postDate}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className={styles.postTitle}>{post.title}</h3>
                  <p className={styles.postExcerpt}>{post.content}</p>
                  <div className={styles.postBottom}>
                    {post.author && (
                      <span className={styles.postAuthor}>
                        <span className={styles.authorAvatar}>{post.author.name.charAt(0)}</span>
                        {post.author.name}
                      </span>
                    )}
                    <div className={styles.postStats}>
                      <span className={styles.postStat}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {post.views}
                      </span>
                      <span className={styles.postStat}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                        {post.likes}
                      </span>
                      <span className={styles.postStat}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>&#9776;</div>
              <h3 className={styles.emptyTitle}>No posts found</h3>
              <p className={styles.emptyDesc}>Try a different search term or browse the community board.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
