const API_BASE = '';

// -- Types --

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ItemStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';

export type PaymentMethod = 'BANK_TRANSFER' | 'EMAIL_INVOICE';

export interface OrderItem {
  id: string;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
  itemStatus: ItemStatus;
  paymentStatus?: 'UNPAID' | 'PAID';
  trackingNumber: string | null;
  sellerId?: string;
  sellerName?: string;
}

export interface OrderStatusHistory {
  id: string;
  previousStatus: string;
  newStatus: string;
  reason: string | null;
  changedBy: string;
  changedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
  shippingAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  shippingMemo: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

export interface OrderListResponse {
  items: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SellerSaleItem {
  id: string;
  orderId: string;
  orderNo: string;
  orderStatus: OrderStatus;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
  itemStatus: ItemStatus;
  paymentStatus: 'UNPAID' | 'PAID';
  trackingNumber: string | null;
  buyerId: string;
  paymentMethod: PaymentMethod | null;
  shipAddr: string | null;
  shipReceiverName: string | null;
  shipPhone: string | null;
  orderedAt: string;
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

export interface SellerOrderDetail {
  id: string;
  orderNo: string;
  buyer: { id: string; name: string; email: string } | null;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  shippingAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  shippingMemo: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface CreateOrderPayload {
  items: { productId: number; quantity: number }[];
  shipAddr?: string;
  shipRcvrNm?: string;
  shipTelno?: string;
  shipMemo?: string;
}

export interface CheckoutPayload {
  items: { productId: number; quantity: number }[];
  paymentMethod: PaymentMethod;
  shipAddr?: string;
  shipRcvrNm?: string;
  shipTelno?: string;
  shipMemo?: string;
}

export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  itemStatus?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

// -- Helpers --

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { getAccessToken } = await import('@/lib/auth');
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new Error('Session expired');
  }

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

// -- API Functions --

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

export async function checkoutOrder(data: CheckoutPayload): Promise<Order> {
  return apiFetch<Order>('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function payOrder(
  id: string,
  paymentMethod: PaymentMethod,
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentMethod }),
  });
}

export async function confirmItemPayment(
  orderId: string,
  itemId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/orders/sales/${orderId}/items/${itemId}/payment`, {
    method: 'PATCH',
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
  params: FetchOrdersParams | Record<string, unknown> = {},
): Promise<SellerSalesResponse> {
  const qs = buildQueryString(params);
  const raw = await apiFetch<{
    items: SellerSaleItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/orders/sales${qs}`);

  return {
    sales: raw.items,
    total: raw.pagination.total,
    page: raw.pagination.page,
    limit: raw.pagination.limit,
    totalPages: raw.pagination.totalPages,
  };
}

export async function fetchSellerSummary(): Promise<SellerSummary> {
  return apiFetch<SellerSummary>('/api/orders/sales/summary');
}

export async function fetchSellerOrderDetail(
  id: string,
): Promise<SellerOrderDetail> {
  return apiFetch<SellerOrderDetail>(`/api/orders/sales/${id}`);
}

export async function updateItemStatus(
  orderId: string,
  itemId: string,
  status: ItemStatus,
  trackingNumber?: string,
): Promise<OrderItem> {
  return apiFetch<OrderItem>(
    `/api/orders/sales/${orderId}/items/${itemId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(trackingNumber ? { trackingNumber } : {}),
      }),
    },
  );
}

export async function bulkUpdateItemStatus(
  itemIds: string[],
  status: ItemStatus,
  trackingNumber?: string,
): Promise<{ updated: number; failed: number }> {
  return apiFetch<{ updated: number; failed: number }>(
    '/api/orders/sales/bulk-status',
    {
      method: 'POST',
      body: JSON.stringify({
        itemIds,
        status,
        ...(trackingNumber ? { trackingNumber } : {}),
      }),
    },
  );
}
