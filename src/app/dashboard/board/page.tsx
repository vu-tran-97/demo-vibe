'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  fetchPosts,
  deletePost,
  fetchBanner,
  updateBanner as updateBannerApi,
  CATEGORIES,
  getCategoryLabel,
  type Post,
  type Pagination,
  type Banner,
  type UpdateBannerData,
} from '@/lib/board';
import { useAuth } from '@/hooks/use-auth';
import { showToast, ToastContainer } from '@/components/toast/Toast';

type SortOption = 'newest' | 'views' | 'comments';

function getCategoryBadgeClasses(category: string) {
  switch (category) {
    case 'NOTICE': return 'text-gold-dark bg-[rgba(200,169,110,0.12)]';
    case 'QNA': return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
    case 'REVIEW': return 'text-success bg-[rgba(90,138,106,0.08)]';
    default: return 'text-slate bg-ivory-warm';
  }
}

// Kebab menu for post actions (edit/delete)
function PostKebabMenu({
  post,
  onDelete,
}: {
  post: Post;
  onDelete: (postId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0 self-start mt-[2px]" ref={ref}>
      <button
        type="button"
        className="w-[32px] h-[32px] flex items-center justify-center text-[1.125rem] text-muted bg-transparent border border-transparent rounded-full cursor-pointer transition-all duration-[200ms] leading-none hover:text-charcoal hover:bg-ivory hover:border-border"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
          setConfirmDelete(false);
        }}
        aria-label="Post actions"
      >
        &#x22EE;
      </button>
      {open && !confirmDelete && (
        <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-border rounded-[8px] shadow-medium min-w-[160px] z-50 py-[0.25rem] animate-[kebabFadeIn_100ms_ease]">
          <Link
            href={`/dashboard/board/${post.id}/edit`}
            className="block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] text-charcoal bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] no-underline hover:bg-ivory"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            Edit
          </Link>
          <button
            type="button"
            className="block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] text-error bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] hover:bg-[rgba(196,91,91,0.06)] hover:text-error"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDelete(true);
            }}
          >
            Delete
          </button>
        </div>
      )}
      {open && confirmDelete && (
        <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-border rounded-[8px] shadow-medium min-w-[160px] z-50 py-[0.25rem] animate-[kebabFadeIn_100ms_ease]">
          <p className="py-[0.5rem] px-[1.5rem] text-[0.8125rem] text-charcoal font-medium">Delete this post?</p>
          <div className="flex gap-[0.5rem] py-[0.25rem] px-[1.5rem] pb-[0.5rem]">
            <button
              type="button"
              className="flex-1 py-[0.375rem] font-body text-[0.75rem] font-medium text-charcoal bg-ivory border border-border rounded-[4px] cursor-pointer transition-[background] duration-[200ms] hover:bg-border-light"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmDelete(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 py-[0.375rem] font-body text-[0.75rem] font-medium text-white bg-error border-none rounded-[4px] cursor-pointer transition-[background] duration-[200ms] hover:bg-[#b04a4a]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                setConfirmDelete(false);
                onDelete(post.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Banner settings modal for SUPER_ADMIN
function BannerSettingsModal({
  banner,
  onClose,
  onSave,
}: {
  banner: Banner | null;
  onClose: () => void;
  onSave: (data: UpdateBannerData) => void;
}) {
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl || '');
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl || '');
  const [enabled, setEnabled] = useState(banner?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      onSave({
        imageUrl,
        title: title || undefined,
        subtitle: subtitle || undefined,
        linkUrl: linkUrl || undefined,
        enabled,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-[4px] flex items-center justify-center z-[1000] p-[1.5rem] animate-[modalFadeIn_150ms_ease]" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-elevated w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-[modalSlideUp_200ms_cubic-bezier(0.16,1,0.3,1)] max-sm:max-w-full max-sm:mx-[0.5rem]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between py-[2rem] px-[3rem] pb-[1rem] max-sm:py-[1.5rem] max-sm:px-[1.5rem] max-sm:pb-[0.5rem]">
          <h3 className="font-display text-[1.25rem] font-normal text-charcoal">Banner Settings</h3>
          <button
            type="button"
            className="w-[32px] h-[32px] flex items-center justify-center text-[1.25rem] text-muted bg-transparent border-none rounded-full cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-[1.5rem] py-[1rem] px-[3rem] pb-[3rem] max-sm:py-[0.5rem] max-sm:px-[1.5rem] max-sm:pb-[1.5rem]">
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal">Image URL *</label>
            <input
              type="url"
              className="py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/banner.jpg"
              required
            />
            {imageUrl && (
              <div className="mt-[0.5rem] rounded-[8px] overflow-hidden border border-border-light h-[120px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover block" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal">Title</label>
            <input
              type="text"
              className="py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Banner title"
              maxLength={100}
            />
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal">Subtitle</label>
            <input
              type="text"
              className="py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Banner subtitle"
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-[0.25rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal">Link URL</label>
            <input
              type="url"
              className="py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal outline-none transition-[border-color] duration-[200ms] focus:border-charcoal placeholder:text-muted"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="flex items-center justify-between gap-[1rem]">
            <label className="text-[0.8125rem] font-medium text-charcoal">Enable Banner</label>
            <button
              type="button"
              className={`relative w-[44px] h-[24px] border-none rounded-[12px] cursor-pointer transition-[background] duration-[200ms] shrink-0 ${enabled ? 'bg-charcoal' : 'bg-border'}`}
              onClick={() => setEnabled(!enabled)}
              aria-label="Toggle banner"
            >
              <span className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_1px_3px_rgba(0,0,0,0.15)] ${enabled ? 'translate-x-[20px]' : ''}`} />
            </button>
          </div>
          <div className="flex gap-[0.5rem] justify-end pt-[1rem] border-t border-t-border-light">
            <button type="button" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-ivory border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-border-light" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed" disabled={saving || !imageUrl}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  // Banner state
  const [banner, setBanner] = useState<Banner | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchBanner()
      .then(setBanner)
      .catch(() => {
        // Banner fetch failure is non-critical
      });
  }, []);

  const handleBannerSave = async (data: UpdateBannerData) => {
    try {
      const updated = await updateBannerApi(data);
      setBanner(updated);
      setShowBannerModal(false);
      showToast('Banner updated successfully');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update banner',
        'error',
      );
    }
  };

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

  function canManagePost(post: Post): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return post.author?.id === user.id;
  }

  async function handleDeletePost(postId: number) {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
      showToast('Post deleted successfully');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete post',
        'error',
      );
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
    <div className="flex flex-col gap-[2rem]">
      {/* Banner */}
      {banner && banner.enabled && (
        <div className="relative rounded-[12px] overflow-hidden">
          {banner.linkUrl ? (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline text-inherit"
            >
              <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden max-sm:h-[140px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover block" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_50%,transparent_100%)] flex flex-col justify-end py-[2rem] px-[3rem] max-sm:py-[1rem] max-sm:px-[1.5rem]">
                  {banner.title && <h2 className="font-display text-[1.5rem] font-medium text-[#fff] leading-[1.3] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] max-sm:text-[1.125rem]">{banner.title}</h2>}
                  {banner.subtitle && <p className="text-[0.875rem] text-[rgba(255,255,255,0.85)] mt-[4px] leading-[1.4] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] max-sm:text-[0.75rem]">{banner.subtitle}</p>}
                </div>
              </div>
            </a>
          ) : (
            <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden max-sm:h-[140px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover block" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_50%,transparent_100%)] flex flex-col justify-end py-[2rem] px-[3rem] max-sm:py-[1rem] max-sm:px-[1.5rem]">
                {banner.title && <h2 className="font-display text-[1.5rem] font-medium text-[#fff] leading-[1.3] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] max-sm:text-[1.125rem]">{banner.title}</h2>}
                {banner.subtitle && <p className="text-[0.875rem] text-[rgba(255,255,255,0.85)] mt-[4px] leading-[1.4] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] max-sm:text-[0.75rem]">{banner.subtitle}</p>}
              </div>
            </div>
          )}
          {isAdmin && (
            <button
              type="button"
              className="absolute top-[1rem] right-[1rem] py-[0.375rem] px-[0.875rem] bg-[rgba(255,255,255,0.9)] backdrop-blur-[8px] text-charcoal border border-[rgba(255,255,255,0.4)] rounded-[8px] font-body text-[0.75rem] font-medium cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[2] hover:bg-[#fff] hover:shadow-soft max-sm:py-[0.25rem] max-sm:px-[0.625rem] max-sm:text-[0.6875rem]"
              onClick={() => setShowBannerModal(true)}
            >
              Edit Banner
            </button>
          )}
        </div>
      )}

      {/* Admin: show banner settings button when no banner */}
      {isAdmin && (!banner || !banner.enabled) && (
        <button
          type="button"
          className="flex items-center justify-center w-full p-[1.5rem] bg-ivory border-2 border-dashed border-border rounded-[12px] font-body text-[0.8125rem] font-medium text-muted cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-charcoal hover:text-charcoal hover:bg-ivory-warm"
          onClick={() => setShowBannerModal(true)}
        >
          + Add Banner
        </button>
      )}

      {/* Banner Settings Modal */}
      {showBannerModal && (
        <BannerSettingsModal
          banner={banner}
          onClose={() => setShowBannerModal(false)}
          onSave={handleBannerSave}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-[1rem]">
        <div>
          <h2 className="font-display text-[1.75rem] font-normal">Community Board</h2>
          <p className="text-[0.8125rem] text-muted mt-[2px]">
            {pagination ? `${pagination.total} posts` : 'Loading...'}
          </p>
        </div>
        <Link href="/dashboard/board/create" className="flex items-center gap-[0.5rem] py-[0.625rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] no-underline hover:bg-charcoal-light hover:-translate-y-[1px] hover:shadow-soft">
          + New Post
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-[0.5rem] max-sm:flex-col" onSubmit={handleSearch}>
        <div className="flex items-center gap-[0.5rem] py-[0.5rem] px-[0.875rem] bg-white border border-border rounded-[8px] flex-1 transition-[border-color] duration-[200ms] focus-within:border-charcoal">
          <svg className="text-muted shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="flex-1 border-none bg-transparent font-body text-[0.8125rem] text-charcoal outline-none placeholder:text-muted"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="py-[0.5rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-[background] duration-[200ms] whitespace-nowrap hover:bg-charcoal-light">Search</button>
      </form>

      {/* Filters */}
      <div className="flex items-center justify-between gap-[1.5rem] max-sm:flex-col max-sm:items-stretch">
        <div className="flex gap-[2px] bg-ivory-warm rounded-[8px] p-[3px] overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <button
            type="button"
            className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hover:text-charcoal ${activeCategory === null ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`}
            onClick={() => handleCategoryChange(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-normal text-slate bg-transparent border-none rounded-[6px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hover:text-charcoal ${activeCategory === cat.code ? 'bg-white text-charcoal font-medium shadow-subtle' : ''}`}
              onClick={() => handleCategoryChange(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          className="py-[0.5rem] px-[0.875rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] outline-none cursor-pointer transition-[border-color] duration-[200ms] shrink-0 focus:border-charcoal"
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
        <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
          <div className="w-[32px] h-[32px] border-2 border-border-light border-t-charcoal rounded-full animate-spin" />
          <p>Loading posts...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-[4rem] px-[2rem] text-error text-[0.9375rem]">
          <p>{error}</p>
          <button type="button" className="mt-[1rem] py-[0.5rem] px-[1.5rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] cursor-pointer transition-[background] duration-[200ms] hover:bg-charcoal-light" onClick={loadPosts}>
            Retry
          </button>
        </div>
      )}

      {/* Post List */}
      {!loading && !error && posts.length > 0 && (
        <div className="flex flex-col gap-[0.5rem]">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`flex items-start gap-[0.5rem] py-[1.5rem] px-[2rem] bg-white border border-border-light rounded-[12px] transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] text-left w-full text-inherit relative hover:border-border hover:shadow-soft hover:-translate-y-[1px] max-sm:py-[1rem] max-sm:px-[1.5rem] ${post.pinned ? 'bg-[linear-gradient(135deg,rgba(200,169,110,0.04)_0%,var(--color-white)_100%)] border-[rgba(200,169,110,0.2)]' : ''}`}
            >
              <Link
                href={`/dashboard/board/${post.id}`}
                className="flex flex-col gap-[0.5rem] no-underline text-inherit cursor-pointer flex-1 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[0.5rem]">
                    <span className={`text-[0.6875rem] font-semibold py-[2px] px-[8px] rounded-[4px] tracking-[0.02em] ${getCategoryBadgeClasses(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    {post.pinned && <span className="text-[0.6875rem] font-medium text-gold-dark flex items-center gap-[3px]">Pinned</span>}
                  </div>
                  <span className="text-[0.75rem] text-muted">{formatDate(post.createdAt)}</span>
                </div>
                <h3 className="font-body text-[0.9375rem] font-medium text-charcoal leading-[1.4]">{post.title}</h3>
                <p className="text-[0.8125rem] text-slate leading-[1.5] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [display:-webkit-box] overflow-hidden">{post.content}</p>
                <div className="flex items-center justify-between pt-[0.5rem] max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
                  <span className="flex items-center gap-[0.5rem] text-[0.8125rem] text-slate">
                    <span className="w-[24px] h-[24px] rounded-full bg-ivory-warm flex items-center justify-center font-display text-[0.6875rem] font-medium text-gold-dark shrink-0">
                      {post.author?.name?.charAt(0) || '?'}
                    </span>
                    {post.author?.name || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-[1rem]">
                    <span className="flex items-center gap-[4px] text-[0.75rem] text-muted [&_svg]:opacity-60">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {post.viewCount}
                    </span>
                    <span className="flex items-center gap-[4px] text-[0.75rem] text-muted [&_svg]:opacity-60">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      {post.likeCount}
                    </span>
                    <span className="flex items-center gap-[4px] text-[0.75rem] text-muted [&_svg]:opacity-60">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {post.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
              {canManagePost(post) && (
                <PostKebabMenu post={post} onDelete={handleDeletePost} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-[6rem] px-[2rem]">
          <div className="text-[2.5rem] text-border mb-[1.5rem]">&#9776;</div>
          <h3 className="font-display text-[1.25rem] text-charcoal mb-[0.5rem]">No posts found</h3>
          <p className="text-[0.875rem] text-muted">
            Try a different search or category, or create the first post.
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-[1.5rem] pt-[1.5rem]">
          <button
            type="button"
            className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            &#8592; Previous
          </button>
          <span className="text-[0.8125rem] text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next &#8594;
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
