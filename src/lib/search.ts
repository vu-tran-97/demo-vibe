const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ──

export interface SearchProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string;
  stockQuantity: number;
  soldCount: number;
  averageRating: number;
  reviewCount: number;
  searchTags: string[];
  createdAt: string;
  seller: { id: string; name: string; nickname: string } | null;
}

export interface SearchPost {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string; nickname: string } | null;
}

export interface SearchResponse {
  products: { items: SearchProduct[]; total: number };
  posts: { items: SearchPost[]; total: number };
}

export interface SearchSuggestion {
  type: 'product' | 'post';
  id: string;
  title: string;
}

export interface SuggestResponse {
  suggestions: SearchSuggestion[];
}

// ── API Functions ──

export async function fetchSearchResults(q: string, page = 1, limit = 12): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/search?${params}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Search failed');
  }
  return json.data;
}

export async function fetchSearchSuggestions(q: string): Promise<SuggestResponse> {
  const params = new URLSearchParams({ q });
  const res = await fetch(`${API_BASE}/api/search/suggest?${params}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Suggestions failed');
  }
  return json.data;
}

// ── Recent Searches (localStorage) ──

const RECENT_SEARCHES_KEY = 'vibe_recent_searches';
const MAX_RECENT = 10;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const recent = getRecentSearches().filter((s) => s !== trimmed);
    recent.unshift(trimmed);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail
  }
}
