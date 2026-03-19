import { getAccessToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ──

export interface PostAuthor {
  id: string;
  name: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryLabel: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: PostAuthor | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  depth: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostListResponse {
  items: Post[];
  pagination: Pagination;
}

export interface FetchPostsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
}

export interface CreatePostData {
  postTtl: string;
  postCn: string;
  postCtgrCd: string;
  srchTags?: string[];
}

export interface UpdatePostData {
  postTtl?: string;
  postCn?: string;
  postCtgrCd?: string;
  srchTags?: string[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  linkUrl: string | null;
  enabled: boolean;
}

export interface UpdateBannerData {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  enabled: boolean;
}

// ── Static Data ──

const CATEGORY_LABELS: Record<string, string> = {
  NOTICE: 'Notice',
  FREE: 'Free Board',
  QNA: 'Q&A',
  REVIEW: 'Reviews',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([code, label]) => ({
  code,
  label,
}));

export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] || code;
}

// ── Helpers ──

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ── Mapper ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(raw: any): Post {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    category: raw.category,
    categoryLabel: CATEGORY_LABELS[raw.category] || raw.category,
    viewCount: raw.viewCount ?? 0,
    likeCount: raw.likeCount ?? 0,
    commentCount: raw.commentCount ?? 0,
    pinned: raw.pinned ?? false,
    tags: raw.tags || [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    author: raw.author || null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapComment(raw: any): Comment {
  return {
    id: raw.id,
    postId: raw.postId,
    userId: raw.userId,
    content: raw.content,
    parentCommentId: raw.parentCommentId || null,
    depth: raw.depth ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    author: raw.author || null,
  };
}

// ── API Functions — Banner ──

export async function fetchBanner(): Promise<Banner | null> {
  const res = await fetch(`${API_BASE}/api/posts/banner`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch banner');
  }
  return json.data || null;
}

export async function updateBanner(data: UpdateBannerData): Promise<Banner> {
  const res = await fetch(`${API_BASE}/api/posts/banner`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || 'Failed to update banner');
  }
  return json.data;
}

// ── API Functions — Posts ──

export async function fetchPosts(params: FetchPostsParams = {}): Promise<PostListResponse> {
  const qs = buildQueryString(params as unknown as Record<string, unknown>);
  const res = await fetch(`${API_BASE}/api/posts${qs}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch posts');
  }
  return {
    items: (json.data.items || []).map(mapPost),
    pagination: json.data.pagination,
  };
}

export async function fetchPostById(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch post');
  }
  return mapPost(json.data);
}

export async function createPost(data: CreatePostData): Promise<Post> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || 'Failed to create post');
  }
  return mapPost(json.data);
}

export async function updatePost(id: string, data: UpdatePostData): Promise<Post> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || 'Failed to update post');
  }
  return mapPost(json.data);
}

export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to delete post');
  }
}

// ── API Functions — Comments ──

export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch comments');
  }
  return (json.data || []).map(mapComment);
}

export async function createComment(
  postId: string,
  cmntCn: string,
  prntCmntId?: string,
): Promise<Comment> {
  const body: Record<string, string> = { cmntCn };
  if (prntCmntId) body.prntCmntId = prntCmntId;

  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || 'Failed to create comment');
  }
  return mapComment(json.data);
}

export async function updateComment(
  postId: string,
  commentId: string,
  cmntCn: string,
): Promise<Comment> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cmntCn }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || 'Failed to update comment');
  }
  return mapComment(json.data);
}

export async function deleteComment(
  postId: string,
  commentId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to delete comment');
  }
}
