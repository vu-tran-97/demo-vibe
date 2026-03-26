'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPostById, updatePost, CATEGORIES, type Post } from '@/lib/board';
import { useAuth } from '@/hooks/use-auth';

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
      <div className="flex flex-col items-center justify-center px-[2rem] py-[8rem] text-muted text-[0.9375rem] gap-[1rem]">
        <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center px-[2rem] py-[8rem]">
        <h2 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">Post Not Found</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          {error || 'The post you are trying to edit does not exist.'}
        </p>
        <Link
          href="/dashboard/board"
          className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-[200ms] no-underline hover:text-gold"
        >
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
      <div className="text-center px-[2rem] py-[8rem]">
        <h2 className="font-display text-[1.5rem] text-charcoal mb-[0.5rem]">Access Denied</h2>
        <p className="text-[0.9375rem] text-muted mb-[2rem]">
          You can only edit your own posts.
        </p>
        <Link
          href={`/dashboard/board/${postId}`}
          className="text-[0.875rem] font-medium text-gold-dark transition-colors duration-[200ms] no-underline hover:text-gold"
        >
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
    <div className="max-w-[720px] animate-fade-in-up-sm">
      <Link
        href={`/dashboard/board/${postId}`}
        className="inline-flex items-center gap-[0.5rem] text-[0.8125rem] text-slate mb-[2rem] transition-colors duration-[200ms] no-underline hover:text-charcoal"
      >
        &#8592; Back to Post
      </Link>

      <h1 className="font-display text-[1.75rem] font-normal text-charcoal mb-[3rem]">
        Edit Post
      </h1>

      {error && (
        <div className="px-[1.5rem] py-[1rem] text-[0.875rem] text-error bg-[rgba(196,91,91,0.06)] border border-[rgba(196,91,91,0.15)] rounded-[8px] mb-[1rem]">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-[2rem]" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="category">Category</label>
          <select
            id="category"
            className="px-[1rem] py-[0.75rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none cursor-pointer transition-[border-color] duration-[200ms] focus:border-charcoal"
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

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="px-[1rem] py-[0.75rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] placeholder:text-muted focus:border-charcoal"
            placeholder="Enter post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
          <span className="text-[0.75rem] text-muted mt-[2px]">{title.length}/200</span>
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="content">Content</label>
          <textarea
            id="content"
            className="px-[1rem] py-[0.75rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] resize-y min-h-[200px] leading-[1.7] placeholder:text-muted focus:border-charcoal"
            placeholder="Write your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={10000}
            rows={12}
            required
          />
          <span className="text-[0.75rem] text-muted mt-[2px]">{content.length}/10,000</span>
        </div>

        <div className="flex flex-col gap-[0.25rem]">
          <label className="text-[0.8125rem] font-medium text-charcoal tracking-[0.02em]" htmlFor="tags">Tags (optional)</label>
          <input
            id="tags"
            type="text"
            className="px-[1rem] py-[0.75rem] font-body text-[0.9375rem] text-charcoal bg-white border border-border-light rounded-[8px] outline-none transition-[border-color] duration-[200ms] placeholder:text-muted focus:border-charcoal"
            placeholder="e.g. ceramics, question, tips"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <span className="text-[0.75rem] text-muted mt-[2px]">Comma-separated</span>
        </div>

        <div className="flex gap-[1rem] pt-[1.5rem] border-t border-border-light max-sm:flex-col">
          <button
            type="submit"
            className="flex-1 px-[2rem] py-[0.875rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-[2px] hover:not-disabled:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/dashboard/board/${postId}`}
            className="px-[2rem] py-[0.875rem] font-body text-[0.9375rem] font-medium text-slate bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] no-underline text-center hover:border-charcoal hover:text-charcoal"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
