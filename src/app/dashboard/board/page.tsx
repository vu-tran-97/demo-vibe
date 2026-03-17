'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchPosts,
  CATEGORIES,
  getCategoryLabel,
  type Post,
  type Pagination,
} from '@/lib/board';
import { useAuth } from '@/hooks/use-auth';
import styles from './board.module.css';

type SortOption = 'newest' | 'views' | 'comments';

export default function BoardPage() {
  const { user } = useAuth(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts({
        page,
        limit: 10,
        category: activeCategory || undefined,
        search: search || undefined,
        sort: sortBy,
      });
      setPosts(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, search, sortBy]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(1);
  };

  function getCategoryBadgeClass(category: string) {
    switch (category) {
      case 'NOTICE': return styles.badgeNotice;
      case 'QNA': return styles.badgeQna;
      case 'REVIEW': return styles.badgeReview;
      default: return styles.badgeFree;
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className={styles.board}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Community Board</h2>
          <p className={styles.pageSubtitle}>
            {pagination ? `${pagination.total} posts` : 'Loading...'}
          </p>
        </div>
        <Link href="/dashboard/board/create" className={styles.composeBtn}>
          + New Post
        </Link>
      </div>

      {/* Search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.categoryTabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeCategory === null ? styles.tabActive : ''}`}
            onClick={() => handleCategoryChange(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`${styles.tab} ${activeCategory === cat.code ? styles.tabActive : ''}`}
              onClick={() => handleCategoryChange(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
        >
          <option value="newest">Newest</option>
          <option value="views">Most Viewed</option>
          <option value="comments">Most Commented</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading posts...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={loadPosts}>
            Retry
          </button>
        </div>
      )}

      {/* Post List */}
      {!loading && !error && posts.length > 0 && (
        <div className={styles.postList}>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/dashboard/board/${post.id}`}
              className={`${styles.postItem} ${post.pinned ? styles.postPinned : ''}`}
            >
              <div className={styles.postTop}>
                <div className={styles.postMeta}>
                  <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(post.category)}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                  {post.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
                </div>
                <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
              </div>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postExcerpt}>{post.content}</p>
              <div className={styles.postBottom}>
                <span className={styles.postAuthor}>
                  <span className={styles.authorAvatar}>
                    {post.author?.name?.charAt(0) || '?'}
                  </span>
                  {post.author?.name || 'Unknown'}
                </span>
                <div className={styles.postStats}>
                  <span className={styles.postStat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {post.viewCount}
                  </span>
                  <span className={styles.postStat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    {post.likeCount}
                  </span>
                  <span className={styles.postStat}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>&#9776;</div>
          <h3 className={styles.emptyTitle}>No posts found</h3>
          <p className={styles.emptyDesc}>
            Try a different search or category, or create the first post.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &#8592; Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next &#8594;
          </button>
        </div>
      )}
    </div>
  );
}
