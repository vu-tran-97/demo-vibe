const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  emailVerified: boolean;
  profileImageUrl: string | null;
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

async function authFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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
): Promise<AuthResponse> {
  const body: Record<string, unknown> = { email, password, name };
  if (nickname) body.nickname = nickname;
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

export async function refreshTokens(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
  }
  const data = await authFetch<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
}

function saveTokens(data: AuthResponse): void {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
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
