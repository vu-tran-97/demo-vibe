import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';

const API_BASE = '';

export interface UserInfo {
  id: number;
  firebaseUid: string;
  email: string;
  name: string;
  nickname: string | null;
  profileImageUrl: string | null;
  role: string;
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

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options?.headers, ...headers },
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

export async function signup(
  email: string,
  password: string,
  name: string,
  nickname?: string,
  role?: 'BUYER' | 'SELLER',
): Promise<{ user: UserInfo }> {
  // Create Firebase user
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Set display name in Firebase
  await firebaseUpdateProfile(cred.user, { displayName: name });

  // Update profile in backend (guard auto-creates user, then we set role/nickname)
  const updateBody: Record<string, unknown> = { name };
  if (nickname) updateBody.nickname = nickname;
  const profile = await apiFetch<UserInfo>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updateBody),
  });

  // Set role if provided
  if (role) {
    const updatedProfile = await apiFetch<UserInfo>('/api/auth/role', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    localStorage.setItem('user', JSON.stringify(updatedProfile));
    return { user: updatedProfile };
  }

  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: UserInfo }> {
  await signInWithEmailAndPassword(auth, email, password);

  // Fetch profile from backend (guard auto-creates if needed)
  const profile = await apiFetch<UserInfo>('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}

export async function loginWithGoogle(): Promise<{ user: UserInfo }> {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);

  // Fetch profile from backend (guard auto-creates if needed)
  const profile = await apiFetch<UserInfo>('/api/auth/me');
  localStorage.setItem('user', JSON.stringify(profile));
  return { user: profile };
}

export async function logout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('user');
}

export async function forgotPassword(email: string): Promise<string> {
  await sendPasswordResetEmail(auth, email);
  return 'If an account with that email exists, a reset link has been sent.';
}

export async function updateProfile(data: {
  name?: string;
  nickname?: string;
  profileImageUrl?: string;
}): Promise<UserInfo> {
  const user = await apiFetch<UserInfo>(
    '/api/auth/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export async function deleteAccount(): Promise<string> {
  const data = await apiFetch<{ message: string }>(
    '/api/auth/account',
    { method: 'DELETE' },
  );
  await signOut(auth);
  localStorage.removeItem('user');
  return data.message;
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
  return !!auth.currentUser || !!getUser();
}

/**
 * Get Firebase ID token for API calls.
 * Returns null if no user is signed in.
 */
export async function getAccessToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
