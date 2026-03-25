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
import styles from './detail.module.css';

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
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading post...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <Link href="/dashboard/board" className={styles.backLink}>
          &#8592; Back to Board
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className={styles.container}>
      <Link href="/dashboard/board" className={styles.backLink}>
        &#8592; Back to Board
      </Link>

      {/* Post Header */}
      <div className={styles.postHeader}>
        <div className={styles.postMeta}>
          <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(post.category)}`}>
            {getCategoryLabel(post.category)}
          </span>
          {post.pinned && <span className={styles.pinnedBadge}>Pinned</span>}
        </div>
        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.authorRow}>
          <div className={styles.authorInfo}>
            <span className={styles.authorAvatar}>
              {post.author?.name?.charAt(0) || '?'}
            </span>
            <div>
              <p className={styles.authorName}>{post.author?.name || 'Unknown'}</p>
              {post.author?.nickname && (
                <p className={styles.authorNick}>@{post.author.nickname}</p>
              )}
            </div>
          </div>
          <span className={styles.postDate}>{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {/* Post Stats */}
      <div className={styles.statsRow}>
        <span className={styles.stat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {post.viewCount} views
        </span>
        <span className={styles.stat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          {post.likeCount} likes
        </span>
        <span className={styles.stat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {post.commentCount} comments
        </span>
      </div>

      {/* Post Content */}
      <div className={styles.postContent}>
        <p>{post.content}</p>
      </div>

      {/* Post Actions */}
      {canModifyPost && (
        <div className={styles.postActions}>
          <Link
            href={`/dashboard/board/${post.id}/edit`}
            className={styles.editBtn}
          >
            Edit
          </Link>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className={styles.confirmBox}>
          <p className={styles.confirmText}>Are you sure you want to delete this post?</p>
          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.confirmCancel}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmDelete}
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
        <div className={styles.errorMsg}>{error}</div>
      )}

      {/* Comments Section */}
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsTitle}>
          Comments ({post.commentCount})
        </h3>

        {/* Add Comment */}
        <div className={styles.addComment}>
          <textarea
            className={styles.commentTextarea}
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
          />
          <button
            type="button"
            className={styles.commentSubmitBtn}
            onClick={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {/* Comment List */}
        <div className={styles.commentList}>
          {rootComments.length === 0 && (
            <p className={styles.noComments}>No comments yet. Be the first to comment.</p>
          )}

          {rootComments.map((comment) => (
            <div key={comment.id} className={styles.commentThread}>
              {/* Root Comment */}
              <div className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentAuthor}>
                    <span className={styles.commentAvatar}>
                      {comment.author?.name?.charAt(0) || '?'}
                    </span>
                    <div>
                      <span className={styles.commentName}>
                        {comment.author?.name || 'Unknown'}
                      </span>
                      <span className={styles.commentDate}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  {canModifyComment(comment) && editingComment !== comment.id && (
                    <div className={styles.commentActions}>
                      <button
                        type="button"
                        className={styles.commentActionBtn}
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditText(comment.content);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.commentActionBtn}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className={styles.editCommentForm}>
                    <textarea
                      className={styles.commentTextarea}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                    />
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.commentCancelBtn}
                        onClick={() => {
                          setEditingComment(null);
                          setEditText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.commentSubmitBtn}
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || submitting}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.commentContent}>{comment.content}</p>
                )}

                {/* Reply button */}
                {replyTo !== comment.id && editingComment !== comment.id && (
                  <button
                    type="button"
                    className={styles.replyBtn}
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
                  <div className={styles.replyForm}>
                    <textarea
                      className={styles.commentTextarea}
                      placeholder={`Reply to ${comment.author?.name || 'Unknown'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <div className={styles.editActions}>
                      <button
                        type="button"
                        className={styles.commentCancelBtn}
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.commentSubmitBtn}
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
                <div key={reply.id} className={styles.replyItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAuthor}>
                      <span className={styles.commentAvatar}>
                        {reply.author?.name?.charAt(0) || '?'}
                      </span>
                      <div>
                        <span className={styles.commentName}>
                          {reply.author?.name || 'Unknown'}
                        </span>
                        <span className={styles.commentDate}>
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                    {canModifyComment(reply) && editingComment !== reply.id && (
                      <div className={styles.commentActions}>
                        <button
                          type="button"
                          className={styles.commentActionBtn}
                          onClick={() => {
                            setEditingComment(reply.id);
                            setEditText(reply.content);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.commentActionBtn}
                          onClick={() => handleDeleteComment(reply.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingComment === reply.id ? (
                    <div className={styles.editCommentForm}>
                      <textarea
                        className={styles.commentTextarea}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                      />
                      <div className={styles.editActions}>
                        <button
                          type="button"
                          className={styles.commentCancelBtn}
                          onClick={() => {
                            setEditingComment(null);
                            setEditText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.commentSubmitBtn}
                          onClick={() => handleEditComment(reply.id)}
                          disabled={!editText.trim() || submitting}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.commentContent}>{reply.content}</p>
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
