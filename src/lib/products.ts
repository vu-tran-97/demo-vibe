import { getAccessToken } from '@/lib/auth';

const API_BASE = '';

// ── Types ──

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  sold: number;
  views: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  status?: 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN';
  seller: {
    id?: number;
    name: string;
    nickname: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: Pagination;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  categories?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  category: string;
  stock: number;
  imageUrl: string;
  images?: string[];
  tags?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {}

// ── Static Data ──

const CATEGORY_LABELS: Record<string, string> = {
  CERAMICS: 'Ceramics & Pottery',
  TEXTILES: 'Textiles & Fabrics',
  ART: 'Art & Prints',
  JEWELRY: 'Jewelry & Accessories',
  HOME: 'Home & Living',
  FOOD: 'Food & Beverages',
};

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([code, label]) => ({
  code,
  label,
}));

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] || code;
}

// ── Helpers ──

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handle401(res: Response): void {
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
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
function mapProduct(raw: any): Product {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    price: raw.price,
    salePrice: raw.salePrice ?? null,
    category: raw.category,
    categoryLabel: CATEGORY_LABELS[raw.category] || raw.category,
    imageUrl: raw.imageUrl || '',
    images: raw.imageUrls || raw.images || [],
    stock: raw.stockQuantity ?? raw.stock ?? 0,
    sold: raw.soldCount ?? raw.sold ?? 0,
    views: raw.viewCount ?? raw.views ?? 0,
    rating: raw.averageRating ?? raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    tags: raw.searchTags || raw.tags || [],
    status: raw.status === 'ACTV' ? 'ACTIVE' : raw.status,
    seller: raw.seller || { name: 'Unknown', nickname: '' },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProductList(data: any): ProductListResponse {
  return {
    items: (data.items || []).map(mapProduct),
    pagination: data.pagination,
  };
}

// ── API Functions ──

export async function fetchProducts(params: FetchProductsParams = {}): Promise<ProductListResponse> {
  const qs = buildQueryString(params as unknown as Record<string, unknown>);
  const res = await fetch(`${API_BASE}/api/products${qs}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch products');
  }
  return mapProductList(json.data);
}

export async function fetchMyProducts(params: FetchProductsParams = {}): Promise<ProductListResponse> {
  const qs = buildQueryString(params as unknown as Record<string, unknown>);
  const res = await fetch(`${API_BASE}/api/products/my${qs}`, {
    headers: await getAuthHeaders(),
  });
  handle401(res);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch my products');
  }
  return mapProductList(json.data);
}

export async function fetchProductById(id: string | number): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch product');
  }
  return mapProduct(json.data);
}

function mapProductPayload(data: CreateProductData | UpdateProductData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.prdNm = data.name;
  if (data.description !== undefined) payload.prdDc = data.description;
  if (data.price !== undefined) payload.prdPrc = data.price;
  if (data.salePrice !== undefined) payload.prdSalePrc = data.salePrice;
  if (data.category !== undefined) payload.prdCtgrCd = data.category;
  if (data.stock !== undefined) payload.stckQty = data.stock;
  if (data.imageUrl !== undefined) payload.prdImgUrl = data.imageUrl;
  if (data.images !== undefined) payload.prdImgUrls = data.images;
  if (data.tags !== undefined) payload.srchTags = data.tags;
  return payload;
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(mapProductPayload(data)),
  });
  handle401(res);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to create product');
  }
  return json.data;
}

export async function updateProduct(id: string | number, data: UpdateProductData): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(mapProductPayload(data)),
  });
  handle401(res);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to update product');
  }
  return json.data;
}

export async function updateProductStatus(id: string | number, status: string): Promise<Product> {
  const apiStatus = status === 'ACTIVE' ? 'ACTV' : status;
  const res = await fetch(`${API_BASE}/api/products/${id}/status`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ status: apiStatus }),
  });
  handle401(res);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to update product status');
  }
  return json.data;
}

export async function deleteProduct(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  handle401(res);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to delete product');
  }
}
