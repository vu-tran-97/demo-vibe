const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/* -- Types -- */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  role: 'SUPER_ADMIN' | 'SELLER' | 'BUYER';
  status: 'ACTV' | 'INAC' | 'SUSP';
  emailVerified: boolean;
  profileImageUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  items: AdminUser[];
  pagination: PaginationInfo;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'SELLER' | 'BUYER';
}

export interface UserActivity {
  id: string;
  userId: string;
  type: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  performedBy: string;
  performedByName: string;
  createdAt: string;
}

export interface UserActivityResponse {
  items: UserActivity[];
  pagination: PaginationInfo;
}

export interface DashboardData {
  totalUsers: number;
  newUsersThisWeek: number;
  roleDistribution: Record<string, number>;
  recentActivity: {
    id: string;
    userName: string;
    actionType: string;
    description: string;
    createdAt: string;
  }[];
}

export interface UserSummary {
  user: AdminUser;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  accountAge: number;
  activityCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/* -- Helpers -- */

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    throw new Error('Session expired');
  }

  if (res.status === 403) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    throw new Error('Forbidden');
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.message || json.error || 'Request failed');
  }

  return json.data;
}

/* -- API Functions -- */

export async function fetchAdminUsers(
  params: UserListParams = {},
): Promise<UserListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  const path = `/api/admin/users${qs ? `?${qs}` : ''}`;
  return adminFetch<UserListResponse>(path);
}

export async function createAdminUser(
  data: CreateUserInput,
): Promise<AdminUser> {
  return adminFetch<AdminUser>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  userId: string,
  data: { name?: string; nickname?: string },
): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changeUserRole(
  userId: string,
  role: string,
): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function changeUserStatus(
  userId: string,
  status: string,
): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function resetUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  await adminFetch<{ success: boolean }>(`/api/admin/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function fetchUserActivity(
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<UserActivityResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return adminFetch<UserActivityResponse>(
    `/api/admin/users/${userId}/activity?${query.toString()}`,
  );
}

export async function bulkChangeStatus(
  userIds: string[],
  status: string,
): Promise<{ updated: number }> {
  return adminFetch<{ updated: number }>('/api/admin/users/bulk/status', {
    method: 'POST',
    body: JSON.stringify({ userIds, status }),
  });
}

export async function exportUsersCsv(
  params: UserListParams = {},
): Promise<Blob> {
  const token = getToken();
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  const path = `/api/admin/users/export${qs ? `?${qs}` : ''}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    throw new Error('Session expired');
  }

  if (res.status === 403) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
    throw new Error('Forbidden');
  }

  if (!res.ok) {
    throw new Error('Export failed');
  }

  return res.blob();
}

export async function fetchDashboard(): Promise<DashboardData> {
  return adminFetch<DashboardData>('/api/admin/dashboard');
}

export async function fetchUserSummary(
  userId: string,
): Promise<UserSummary> {
  return adminFetch<UserSummary>(`/api/admin/users/${userId}/summary`);
}
