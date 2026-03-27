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
      <div className="animate-fade-in">
        <div className="text-center py-[8rem] px-[2rem]">
          <div className="text-[3rem] mb-[1.5rem] opacity-30 flex justify-center text-muted">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h3 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">Search for products and posts</h3>
          <p className="text-[0.9375rem] text-muted">Enter at least 2 characters to search across the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-[2rem]">
        <h2 className="font-display text-[1.75rem] font-normal text-charcoal max-sm:text-[1.25rem]">
          Search results for &ldquo;<span className="text-gold-dark">{query}</span>&rdquo;
        </h2>
        <p className="text-[0.875rem] text-muted mt-[0.25rem]">
          {productTotal + postTotal} results found
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-[0.25rem] mb-[2rem] border-b border-border-light max-sm:overflow-x-auto">
        <button
          type="button"
          className={`py-[0.75rem] px-[1.25rem] font-body text-[0.875rem] font-normal bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] -mb-px hover:text-charcoal ${activeTab === 'products' ? 'text-charcoal font-medium !border-b-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('products')}
        >
          Products ({productTotal})
        </button>
        <button
          type="button"
          className={`py-[0.75rem] px-[1.25rem] font-body text-[0.875rem] font-normal bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] -mb-px hover:text-charcoal ${activeTab === 'posts' ? 'text-charcoal font-medium !border-b-charcoal' : 'text-muted'}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({postTotal})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Searching...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-[4rem] px-[2rem] text-error text-[0.9375rem]">
          <p>{error}</p>
          <button
            type="button"
            className="mt-[1rem] py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:border-charcoal"
            onClick={doSearch}
          >
            Retry
          </button>
        </div>
      )}

      {/* Products Tab */}
      {!loading && !error && activeTab === 'products' && (
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[1.5rem] animate-fade-in max-md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] max-sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-sm:gap-[1rem]">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/dashboard/products/${product.id}`}
                  className="bg-white border border-border-light rounded-[12px] overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer no-underline text-inherit block hover:border-border hover:shadow-soft hover:-translate-y-[4px]"
                >
                  <div className="aspect-[4/3] bg-[linear-gradient(145deg,#E8E4DE_0%,#D4CFC6_50%,#C8C0B4_100%)] relative overflow-hidden">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                    )}
                    {product.salePrice !== null && (
                      <span className="absolute top-[1rem] left-[1rem] py-[4px] px-[10px] text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-white bg-error rounded-[4px] z-[1]">Sale</span>
                    )}
                  </div>
                  <div className="p-[1.5rem]">
                    <p className="text-[0.6875rem] font-medium tracking-[0.1em] uppercase text-gold mb-[0.25rem]">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </p>
                    <h3 className="font-display text-[1.125rem] font-medium text-charcoal mb-[0.5rem] leading-[1.3]">{product.name}</h3>
                    {product.seller && (
                      <p className="text-[0.75rem] text-muted mt-[0.5rem]">by {product.seller.name}</p>
                    )}
                    <div className="flex items-center justify-between mt-[1rem]">
                      <div>
                        <span className="text-[0.9375rem] font-medium text-charcoal">
                          {formatPrice(product.salePrice ?? product.price)}
                        </span>
                        {product.salePrice !== null && (
                          <span className="text-[0.8125rem] text-muted line-through ml-[0.5rem]">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-[4px] text-[0.8125rem] text-slate">
                        <span className="text-gold">&#9733;</span>
                        {product.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-[8rem] px-[2rem]">
              <div className="text-[3rem] mb-[1.5rem] opacity-30 flex justify-center text-muted">&#9671;</div>
              <h3 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">No products found</h3>
              <p className="text-[0.9375rem] text-muted">Try a different search term or browse all products.</p>
            </div>
          )}
        </>
      )}

      {/* Posts Tab */}
      {!loading && !error && activeTab === 'posts' && (
        <>
          {posts.length > 0 ? (
            <div className="flex flex-col gap-[1rem] animate-fade-in">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/board/${post.id}`}
                  className="block bg-white border border-border-light rounded-[12px] p-[2rem] no-underline text-inherit transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-border hover:shadow-soft hover:-translate-y-[2px] max-sm:p-[1.5rem]"
                >
                  <div className="flex items-center justify-between mb-[0.5rem]">
                    <span className="text-[0.6875rem] font-semibold tracking-[0.06em] uppercase text-gold-dark bg-[rgba(200,169,110,0.1)] py-[3px] px-[10px] rounded-[4px]">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className="text-[0.75rem] text-muted">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-display text-[1.125rem] font-medium text-charcoal mb-[0.5rem] leading-[1.4]">{post.title}</h3>
                  <p className="text-[0.875rem] text-slate leading-[1.6] line-clamp-2">{post.content}</p>
                  <div className="flex items-center justify-between mt-[1rem] pt-[1rem] border-t border-border-light">
                    {post.author && (
                      <span className="flex items-center gap-[0.5rem] text-[0.8125rem] text-slate">
                        <span className="w-[24px] h-[24px] rounded-full bg-ivory-warm flex items-center justify-center text-[0.6875rem] font-semibold text-gold">{post.author.name.charAt(0)}</span>
                        {post.author.name}
                      </span>
                    )}
                    <div className="flex gap-[1rem]">
                      <span className="flex items-center gap-[4px] text-[0.75rem] text-muted">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {post.views}
                      </span>
                      <span className="flex items-center gap-[4px] text-[0.75rem] text-muted">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-[4px] text-[0.75rem] text-muted">
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
            <div className="text-center py-[8rem] px-[2rem]">
              <div className="text-[3rem] mb-[1.5rem] opacity-30 flex justify-center text-muted">&#9776;</div>
              <h3 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">No posts found</h3>
              <p className="text-[0.9375rem] text-muted">Try a different search term or browse the community board.</p>
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
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
