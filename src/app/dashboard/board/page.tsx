'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import styles from './board.module.css';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  author: { name: string; nickname: string };
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  pinned: boolean;
}

const CATEGORIES = [
  { code: 'ALL', label: 'All' },
  { code: 'NOTICE', label: 'Notice' },
  { code: 'FREE', label: 'Free Board' },
  { code: 'QNA', label: 'Q&A' },
  { code: 'REVIEW', label: 'Reviews' },
];

const MOCK_POSTS: Post[] = [
  {
    id: 'post-001',
    title: 'Welcome to Vibe Community!',
    content: 'We are excited to launch our community board. Share your thoughts, ask questions, and connect with fellow artisan lovers.',
    category: 'NOTICE',
    author: { name: 'Super Admin', nickname: 'superadmin' },
    createdAt: '2026-03-15',
    views: 342,
    likes: 28,
    comments: 12,
    pinned: true,
  },
  {
    id: 'post-002',
    title: 'Shipping Policy Update — Free shipping on orders over $50',
    content: 'Starting this month, all orders over $50 qualify for free standard shipping within Korea.',
    category: 'NOTICE',
    author: { name: 'Super Admin', nickname: 'superadmin' },
    createdAt: '2026-03-14',
    views: 198,
    likes: 45,
    comments: 8,
    pinned: true,
  },
  {
    id: 'post-003',
    title: 'My ceramic vase arrived and it\'s beautiful!',
    content: 'Just received my order from Minji\'s Ceramics. The speckled glaze is even more stunning in person. Highly recommend!',
    category: 'REVIEW',
    author: { name: 'Yuna L.', nickname: 'yuna_lover' },
    createdAt: '2026-03-16',
    views: 87,
    likes: 15,
    comments: 6,
    pinned: false,
  },
  {
    id: 'post-004',
    title: 'How do I care for linen products?',
    content: 'I just bought the linen table runner. Any tips on washing and maintaining it? I want it to last.',
    category: 'QNA',
    author: { name: 'Jihoon C.', nickname: 'jihoon_c' },
    createdAt: '2026-03-15',
    views: 64,
    likes: 3,
    comments: 5,
    pinned: false,
  },
  {
    id: 'post-005',
    title: 'Looking for recommendations: unique gift ideas under $100',
    content: 'My friend\'s birthday is coming up and she loves handmade items. Any suggestions from the shop?',
    category: 'FREE',
    author: { name: 'Hana S.', nickname: 'hana_shop' },
    createdAt: '2026-03-14',
    views: 120,
    likes: 8,
    comments: 14,
    pinned: false,
  },
  {
    id: 'post-006',
    title: 'Watercolor set review — absolutely worth it',
    content: 'The Seasons watercolor set is incredible quality. The colors are vibrant and the paper is thick. Perfect for framing.',
    category: 'REVIEW',
    author: { name: 'Seonwoo P.', nickname: 'seonwoo_art' },
    createdAt: '2026-03-13',
    views: 93,
    likes: 22,
    comments: 4,
    pinned: false,
  },
  {
    id: 'post-007',
    title: 'Can I request custom sizes for prints?',
    content: 'I love the botanical prints but need a specific size for my wall. Does Yuna Art Studio do custom orders?',
    category: 'QNA',
    author: { name: 'Minji K.', nickname: 'minji_buyer' },
    createdAt: '2026-03-12',
    views: 42,
    likes: 2,
    comments: 3,
    pinned: false,
  },
  {
    id: 'post-008',
    title: 'Weekend market haul — sharing my finds!',
    content: 'Picked up some amazing pieces this weekend. The incense holder is my new favorite. What did you all get?',
    category: 'FREE',
    author: { name: 'Buyer Demo', nickname: 'demo_buyer' },
    createdAt: '2026-03-11',
    views: 156,
    likes: 19,
    comments: 11,
    pinned: false,
  },
];

export default function BoardPage() {
  const { user } = useAuth(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('FREE');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const filtered = useMemo(() => {
    let posts = [...MOCK_POSTS];

    // Pinned posts always first
    posts.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (activeCategory !== 'ALL') {
      posts = posts.filter((p) => p.category === activeCategory || p.pinned);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.pinned ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q)
      );
    }

    return posts;
  }, [activeCategory, search]);

  function handleCompose() {
    if (!newTitle.trim() || !newContent.trim()) return;
    setShowCompose(false);
    setNewTitle('');
    setNewContent('');
    setNewCategory('FREE');
  }

  function getCategoryBadgeClass(category: string) {
    switch (category) {
      case 'NOTICE': return styles.badgeNotice;
      case 'QNA': return styles.badgeQna;
      case 'REVIEW': return styles.badgeReview;
      default: return styles.badgeFree;
    }
  }

  function getCategoryLabel(code: string) {
    return CATEGORIES.find((c) => c.code === code)?.label ?? code;
  }

  return (
    <div className={styles.board}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Community Board</h2>
          <p className={styles.pageSubtitle}>{filtered.length} posts</p>
        </div>
        <button
          type="button"
          className={styles.composeBtn}
          onClick={() => setShowCompose(true)}
        >
          + New Post
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              type="button"
              className={`${styles.tab} ${activeCategory === cat.code ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat.code)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Posts */}
      <div className={styles.postList}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>☰</div>
            <h3 className={styles.emptyTitle}>No posts found</h3>
            <p className={styles.emptyDesc}>Try a different search or category.</p>
          </div>
        ) : (
          filtered.map((post, i) => (
            <button
              key={post.id}
              type="button"
              className={`${styles.postItem} ${post.pinned ? styles.postPinned : ''} animate-fade-up delay-${Math.min(i + 1, 8)}`}
              onClick={() => setSelectedPost(post)}
            >
              <div className={styles.postTop}>
                <div className={styles.postMeta}>
                  <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(post.category)}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                  {post.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
                </div>
                <span className={styles.postDate}>{post.createdAt}</span>
              </div>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postExcerpt}>{post.content}</p>
              <div className={styles.postBottom}>
                <span className={styles.postAuthor}>
                  <span className={styles.authorAvatar}>{post.author.name.charAt(0)}</span>
                  {post.author.name}
                </span>
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
            </button>
          ))
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalMeta}>
                <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(selectedPost.category)}`}>
                  {getCategoryLabel(selectedPost.category)}
                </span>
                <span className={styles.postDate}>{selectedPost.createdAt}</span>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setSelectedPost(null)}>
                ✕
              </button>
            </div>
            <h2 className={styles.modalTitle}>{selectedPost.title}</h2>
            <div className={styles.modalAuthor}>
              <span className={styles.authorAvatar}>{selectedPost.author.name.charAt(0)}</span>
              <div>
                <p className={styles.authorName}>{selectedPost.author.name}</p>
                <p className={styles.authorNick}>@{selectedPost.author.nickname}</p>
              </div>
            </div>
            <div className={styles.modalContent}>
              <p>{selectedPost.content}</p>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.actionBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {selectedPost.likes} Likes
              </button>
              <button type="button" className={styles.actionBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {selectedPost.comments} Comments
              </button>
            </div>
            <div className={styles.commentBox}>
              <input
                type="text"
                className={styles.commentInput}
                placeholder="Write a comment..."
              />
              <button type="button" className={styles.commentSubmit}>Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className={styles.modalOverlay} onClick={() => setShowCompose(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Post</h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowCompose(false)}>
                ✕
              </button>
            </div>
            <div className={styles.composeForm}>
              <select
                className={styles.composeSelect}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="FREE">Free Board</option>
                <option value="QNA">Q&A</option>
                <option value="REVIEW">Reviews</option>
              </select>
              <input
                type="text"
                className={styles.composeTitle}
                placeholder="Post title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                className={styles.composeContent}
                placeholder="Write your post..."
                rows={6}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <div className={styles.composeActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowCompose(false)}>
                  Cancel
                </button>
                <button type="button" className={styles.submitBtn} onClick={handleCompose}>
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
