'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchPostById,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  deletePost,
  getCategoryLabel,
  type Post,
  type Comment,
} from '@/lib/board';
import { useAuth } from '@/hooks/use-auth';

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case 'NOTICE': return 'text-gold-dark bg-[rgba(200,169,110,0.12)]';
    case 'QNA': return 'text-[#6B7AE8] bg-[rgba(107,122,232,0.08)]';
    case 'REVIEW': return 'text-success bg-[rgba(90,138,106,0.08)]';
    default: return 'text-slate bg-ivory-warm';
  }
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth(true);
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canModifyPost = post && user && (
    user.id === post.author?.id || user.role === 'SUPER_ADMIN'
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postData, commentsData] = await Promise.all([
        fetchPostById(postId),
        fetchComments(postId),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(postId, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId: number) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(postId, replyText.trim(), parentId);
      setComments((prev) => [...prev, newComment]);
      setReplyTo(null);
      setReplyText('');
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const updated = await updateComment(postId, commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c)),
      );
      setEditingComment(null);
      setEditText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (post) {
        setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deletePost(postId);
      router.push('/dashboard/board');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      setSubmitting(false);
    }
  };

  function canModifyComment(comment: Comment): boolean {
    if (!user) return false;
    return user.id === comment.userId || user.role === 'SUPER_ADMIN';
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Organize comments: root comments with their replies
  const rootComments = comments.filter((c) => c.depth === 0);
  const replyMap = new Map<number, Comment[]>();
  comments
    .filter((c) => c.depth === 1 && c.parentCommentId)
    .forEach((c) => {
      const parentId = c.parentCommentId as number;
      if (!replyMap.has(parentId)) replyMap.set(parentId, []);
      replyMap.get(parentId)?.push(c);
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-[8rem] px-[2rem] text-muted text-[0.9375rem] gap-[1rem]">
        <div className="w-[32px] h-[32px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
        <p>Loading post...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="text-center py-[6rem] px-[2rem] text-error text-[0.9375rem]">
        <p>{error}</p>
        <Link href="/dashboard/board" className="inline-block mt-[1.5rem] text-slate inline-flex items-center gap-[0.5rem] text-[0.8125rem] no-underline transition-colors duration-200 hover:text-charcoal">
          &#8592; Back to Board
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-[780px] animate-fade-in max-md:max-w-full">
      <Link href="/dashboard/board" className="inline-flex items-center gap-[0.5rem] text-[0.8125rem] text-slate mb-[2rem] transition-colors duration-200 no-underline hover:text-charcoal">
        &#8592; Back to Board
      </Link>

      {/* Post Header */}
      <div className="mb-[2rem]">
        <div className="flex items-center gap-[0.5rem] mb-[1rem]">
          <span className={`text-[0.6875rem] font-semibold py-[3px] px-[10px] rounded-[4px] tracking-[0.02em] ${getCategoryBadgeClass(post.category)}`}>
            {getCategoryLabel(post.category)}
          </span>
          {post.pinned && <span className="text-[0.6875rem] font-medium text-gold-dark">Pinned</span>}
        </div>
        <h1 className="font-display text-[1.75rem] font-normal text-charcoal leading-[1.3] mb-[1.5rem] max-sm:text-[1.375rem]">{post.title}</h1>
        <div className="flex items-center justify-between pb-[1.5rem] border-b border-border-light max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
          <div className="flex items-center gap-[1rem]">
            <span className="w-[36px] h-[36px] rounded-full bg-ivory-warm flex items-center justify-center font-display text-[0.8125rem] font-medium text-gold-dark shrink-0">
              {post.author?.name?.charAt(0) || '?'}
            </span>
            <div>
              <p className="text-[0.875rem] font-medium text-charcoal">{post.author?.name || 'Unknown'}</p>
              {post.author?.nickname && (
                <p className="text-[0.75rem] text-muted">@{post.author.nickname}</p>
              )}
            </div>
          </div>
          <span className="text-[0.75rem] text-muted">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {/* Post Stats */}
      <div className="flex gap-[1.5rem] py-[1rem] mb-[1.5rem] max-sm:flex-wrap max-sm:gap-[1rem]">
        <span className="flex items-center gap-[5px] text-[0.8125rem] text-slate">
          <svg className="opacity-60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.viewCount} views
        </span>
        <span className="flex items-center gap-[5px] text-[0.8125rem] text-slate">
          <svg className="opacity-60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {post.likeCount} likes
        </span>
        <span className="flex items-center gap-[5px] text-[0.8125rem] text-slate">
          <svg className="opacity-60" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {post.commentCount} comments
        </span>
      </div>

      {/* Post Content */}
      <div className="text-[0.9375rem] leading-[1.8] text-charcoal pb-[2rem] border-b border-border-light mb-[1.5rem] whitespace-pre-wrap break-words">
        <p>{post.content}</p>
      </div>

      {/* Post Actions */}
      {canModifyPost && (
        <div className="flex gap-[0.5rem] mb-[2rem] max-sm:flex-col">
          <Link
            href={`/dashboard/board/${post.id}/edit`}
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-200 no-underline hover:border-charcoal max-sm:text-center"
          >
            Edit
          </Link>
          <button
            type="button"
            className="py-[0.5rem] px-[1.25rem] font-body text-[0.8125rem] font-medium text-error bg-white border border-[rgba(196,91,91,0.2)] rounded-[8px] cursor-pointer transition-all duration-200 hover:bg-[rgba(196,91,91,0.04)] hover:border-error max-sm:text-center"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="p-[1.5rem] bg-[rgba(196,91,91,0.04)] border border-[rgba(196,91,91,0.15)] rounded-[8px] mb-[2rem]">
          <p className="text-[0.875rem] text-charcoal mb-[1rem]">Are you sure you want to delete this post?</p>
          <div className="flex gap-[0.5rem]">
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-slate bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-charcoal hover:text-charcoal"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-white bg-error border-none rounded-[8px] cursor-pointer transition-opacity duration-200 hover:not-disabled:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDeletePost}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="py-[1rem] px-[1.5rem] text-[0.875rem] text-error bg-[rgba(196,91,91,0.06)] border border-[rgba(196,91,91,0.15)] rounded-[8px] mb-[1.5rem]">{error}</div>
      )}

      {/* Comments Section */}
      <div className="mt-[2rem]">
        <h3 className="font-body text-[1rem] font-medium text-charcoal mb-[1.5rem]">
          Comments ({post.commentCount})
        </h3>

        {/* Add Comment */}
        <div className="flex flex-col gap-[0.5rem] mb-[2rem]">
          <textarea
            className="w-full py-[0.75rem] px-[1rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none resize-y leading-[1.5] transition-colors duration-200 focus:border-charcoal placeholder:text-muted box-border"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <button
            type="button"
            className="self-end py-[0.5rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {/* Comment List */}
        <div className="flex flex-col gap-[1rem]">
          {rootComments.length === 0 && (
            <p className="text-[0.875rem] text-muted text-center py-[3rem]">No comments yet. Be the first to comment.</p>
          )}

          {rootComments.map((comment) => (
            <div key={comment.id} className="flex flex-col">
              {/* Root Comment */}
              <div className="py-[1rem] px-[1.5rem] bg-white border border-border-light rounded-[8px]">
                <div className="flex items-center justify-between mb-[0.5rem]">
                  <div className="flex items-center gap-[0.5rem]">
                    <span className="w-[28px] h-[28px] rounded-full bg-ivory-warm flex items-center justify-center font-display text-[0.625rem] font-medium text-gold-dark shrink-0">
                      {comment.author?.name?.charAt(0) || '?'}
                    </span>
                    <div>
                      <span className="text-[0.8125rem] font-medium text-charcoal mr-[0.5rem]">
                        {comment.author?.name || 'Unknown'}
                      </span>
                      <span className="text-[0.6875rem] text-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  {canModifyComment(comment) && editingComment !== comment.id && (
                    <div className="flex gap-[0.25rem]">
                      <button
                        type="button"
                        className="py-[2px] px-[8px] font-body text-[0.6875rem] text-muted bg-transparent border border-transparent rounded-[4px] cursor-pointer transition-all duration-200 hover:text-charcoal hover:border-border"
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditText(comment.content);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="py-[2px] px-[8px] font-body text-[0.6875rem] text-muted bg-transparent border border-transparent rounded-[4px] cursor-pointer transition-all duration-200 hover:text-charcoal hover:border-border"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className="flex flex-col gap-[0.5rem]">
                    <textarea
                      className="w-full py-[0.75rem] px-[1rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none resize-y leading-[1.5] transition-colors duration-200 focus:border-charcoal placeholder:text-muted box-border"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-[0.5rem] justify-end">
                      <button
                        type="button"
                        className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-slate bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-charcoal hover:text-charcoal"
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="self-end py-[0.5rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || submitting}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[0.875rem] leading-[1.6] text-charcoal whitespace-pre-wrap break-words">{comment.content}</p>
                )}

                {/* Reply button */}
                {replyTo !== comment.id && editingComment !== comment.id && (
                  <button
                    type="button"
                    className="self-start mt-[0.5rem] py-[2px] px-[8px] font-body text-[0.75rem] text-slate bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-charcoal"
                    onClick={() => {
                      setReplyTo(comment.id);
                      setReplyText('');
                    }}
                  >
                    Reply
                  </button>
                )}

                {/* Reply form */}
                {replyTo === comment.id && (
                  <div className="mt-[0.5rem] flex flex-col gap-[0.5rem]">
                    <textarea
                      className="w-full py-[0.75rem] px-[1rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none resize-y leading-[1.5] transition-colors duration-200 focus:border-charcoal placeholder:text-muted box-border"
                      placeholder={`Reply to ${comment.author?.name || 'Unknown'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-[0.5rem] justify-end">
                      <button
                        type="button"
                        className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-slate bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-charcoal hover:text-charcoal"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="self-end py-[0.5rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim() || submitting}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Replies */}
              {replyMap.get(comment.id)?.map((reply) => (
                <div key={reply.id} className="ml-[3rem] mt-[0.25rem] py-[1rem] px-[1.5rem] bg-ivory border border-border-light rounded-[8px] max-sm:ml-[1.5rem]">
                  <div className="flex items-center justify-between mb-[0.5rem]">
                    <div className="flex items-center gap-[0.5rem]">
                      <span className="w-[28px] h-[28px] rounded-full bg-ivory-warm flex items-center justify-center font-display text-[0.625rem] font-medium text-gold-dark shrink-0">
                        {reply.author?.name?.charAt(0) || '?'}
                      </span>
                      <div>
                        <span className="text-[0.8125rem] font-medium text-charcoal mr-[0.5rem]">
                          {reply.author?.name || 'Unknown'}
                        </span>
                        <span className="text-[0.6875rem] text-muted">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                    {canModifyComment(reply) && editingComment !== reply.id && (
                      <div className="flex gap-[0.25rem]">
                        <button
                          type="button"
                          className="py-[2px] px-[8px] font-body text-[0.6875rem] text-muted bg-transparent border border-transparent rounded-[4px] cursor-pointer transition-all duration-200 hover:text-charcoal hover:border-border"
                          onClick={() => {
                            setEditingComment(reply.id);
                            setEditText(reply.content);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="py-[2px] px-[8px] font-body text-[0.6875rem] text-muted bg-transparent border border-transparent rounded-[4px] cursor-pointer transition-all duration-200 hover:text-charcoal hover:border-border"
                          onClick={() => handleDeleteComment(reply.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingComment === reply.id ? (
                    <div className="flex flex-col gap-[0.5rem]">
                      <textarea
                        className="w-full py-[0.75rem] px-[1rem] font-body text-[0.875rem] text-charcoal bg-white border border-border rounded-[8px] outline-none resize-y leading-[1.5] transition-colors duration-200 focus:border-charcoal placeholder:text-muted box-border"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-[0.5rem] justify-end">
                        <button
                          type="button"
                          className="py-[0.5rem] px-[1rem] font-body text-[0.8125rem] text-slate bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-200 hover:border-charcoal hover:text-charcoal"
                          onClick={() => {
                            setEditingComment(null);
                            setEditText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="self-end py-[0.5rem] px-[1.25rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 hover:not-disabled:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => handleEditComment(reply.id)}
                          disabled={!editText.trim() || submitting}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.875rem] leading-[1.6] text-charcoal whitespace-pre-wrap break-words">{reply.content}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
