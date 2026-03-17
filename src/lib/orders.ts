const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ──

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  reason: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shipAddr: string | null;
  shipRcvrNm: string | null;
  shipTelno: string | null;
  shipMemo: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SellerSaleItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  buyerName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface SellerSalesResponse {
  sales: SellerSaleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SellerSummary {
  totalRevenue: number;
  totalOrders: number;
  monthlyBreakdown: {
    month: string;
    revenue: number;
    orderCount: number;
  }[];
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shipAddr?: string;
  shipRcvrNm?: string;
  shipTelno?: string;
  shipMemo?: string;
}

export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

// ── Helpers ──

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || json.error || 'API request failed');
  }

  return json.data as T;
}

function buildQueryString(params: object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ── API Functions ──

export async function fetchBuyerOrders(
  params: FetchOrdersParams = {},
): Promise<OrderListResponse> {
  const qs = buildQueryString(params);
  return apiFetch<OrderListResponse>(`/api/orders${qs}`);
}

export async function fetchOrderById(id: string): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`);
}

export async function createOrder(data: CreateOrderPayload): Promise<Order> {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });
}

export async function fetchSellerSales(
  params: FetchOrdersParams = {},
): Promise<SellerSalesResponse> {
  const qs = buildQueryString(params);
  return apiFetch<SellerSalesResponse>(`/api/orders/sales${qs}`);
}

export async function fetchSellerSummary(): Promise<SellerSummary> {
  return apiFetch<SellerSummary>('/api/orders/sales/summary');
}
