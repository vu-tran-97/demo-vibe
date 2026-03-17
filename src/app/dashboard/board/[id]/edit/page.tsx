'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPostById, updatePost, CATEGORIES, type Post } from '@/lib/board';
import { useAuth } from '@/hooks/use-auth';
import styles from '../../board-form.module.css';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('FREE');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const availableCategories = isAdmin
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.code !== 'NOTICE');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPostById(postId);
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category);
        setTags(data.tags.join(', '));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [postId]);

  if (authLoading || loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.accessDenied}>
        <h2 className={styles.accessDeniedTitle}>Post Not Found</h2>
        <p className={styles.accessDeniedDesc}>
          {error || 'The post you are trying to edit does not exist.'}
        </p>
        <Link href="/dashboard/board" className={styles.accessDeniedLink}>
          &#8592; Back to Board
        </Link>
      </div>
    );
  }

  // Check ownership
  const canEdit = user && (
    user.id === post.author?.id || user.role === 'SUPER_ADMIN'
  );

  if (!canEdit) {
    return (
      <div className={styles.accessDenied}>
        <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
        <p className={styles.accessDeniedDesc}>
          You can only edit your own posts.
        </p>
        <Link href={`/dashboard/board/${postId}`} className={styles.accessDeniedLink}>
          &#8592; Back to Post
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!content.trim()) {
      setError('Please enter content');
      return;
    }

    setSubmitting(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await updatePost(postId, {
        postTtl: title.trim(),
        postCn: content.trim(),
        postCtgrCd: category,
        srchTags: parsedTags,
      });

      router.push(`/dashboard/board/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href={`/dashboard/board/${postId}`} className={styles.backLink}>
        &#8592; Back to Post
      </Link>

      <h1 className={styles.title}>Edit Post</h1>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="category">Category</label>
          <select
            id="category"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {availableCategories.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className={styles.input}
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
          <span className={styles.hint}>{title.length}/200</span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="content">Content</label>
          <textarea
            id="content"
            className={styles.textarea}
            placeholder="Write your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={12}
            required
          />
          <span className={styles.hint}>{content.length}/10,000</span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="tags">Tags (optional)</label>
          <input
            id="tags"
            type="text"
            className={styles.input}
            placeholder="e.g. ceramics, question, tips"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <span className={styles.hint}>Comma-separated</span>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/dashboard/board/${postId}`} className={styles.cancelBtn}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
