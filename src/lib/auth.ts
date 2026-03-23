const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  emailVerified: boolean;
  profileImageUrl: string | null;
  role: string;
}

interface AuthResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function authFetch<T>(
  path: string,
  body?: Record<string, unknown>,
  options?: { method?: string },
): Promise<T> {
  const method = options?.method ?? 'POST';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/signup') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    throw new AuthError('SESSION_EXPIRED', 'Session expired');
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new AuthError(
      json.error || 'UNKNOWN_ERROR',
      json.message || 'An unexpected error occurred',
    );
  }

  return json.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await authFetch<AuthResponse>('/api/auth/login', { email, password });
  saveTokens(data);
  return data;
}

export async function signup(
  email: string,
  password: string,
  name: string,
  nickname?: string,
  role?: 'BUYER' | 'SELLER',
): Promise<AuthResponse> {
  const body: Record<string, unknown> = { email, password, name };
  if (nickname) body.nickname = nickname;
  if (role) body.role = role;
  const data = await authFetch<AuthResponse>('/api/auth/signup', body);
  saveTokens(data);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await authFetch('/api/auth/logout', { refreshToken });
    } catch {
      // ignore logout errors
    }
  }
  clearTokens();
}

export async function forgotPassword(email: string): Promise<string> {
  const data = await authFetch<{ message: string }>('/api/auth/forgot-password', { email });
  return data.message;
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const data = await authFetch<{ message: string }>('/api/auth/reset-password', { token, newPassword });
  return data.message;
}

export async function updateProfile(data: {
  name?: string;
  nickname?: string;
  profileImageUrl?: string;
}): Promise<UserInfo> {
  const user = await authFetch<UserInfo>(
    '/api/auth/profile',
    data as Record<string, unknown>,
    { method: 'PATCH' },
  );
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string> {
  const data = await authFetch<{ message: string }>(
    '/api/auth/password',
    { currentPassword, newPassword },
    { method: 'PATCH' },
  );
  return data.message;
}

export async function deleteAccount(): Promise<string> {
  const data = await authFetch<{ message: string }>(
    '/api/auth/account',
    undefined,
    { method: 'DELETE' },
  );
  clearTokens();
  return data.message;
}

const REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export async function refreshTokens(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
  }
  const data = await authFetch<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('tokenRefreshedAt', Date.now().toString());
}

export function isRefreshNeeded(): boolean {
  if (typeof window === 'undefined') return false;
  const refreshedAt = localStorage.getItem('tokenRefreshedAt');
  if (!refreshedAt) return true;
  return Date.now() - Number(refreshedAt) > REFRESH_INTERVAL_MS;
}

function saveTokens(data: AuthResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('tokenRefreshedAt', Date.now().toString());
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenRefreshedAt');
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function getUser(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
