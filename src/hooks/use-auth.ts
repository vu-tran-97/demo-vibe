'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logout as authLogout, type UserInfo } from '@/lib/auth';

const API_BASE = '';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (json.success) {
            setUser(json.data);
            localStorage.setItem('user', JSON.stringify(json.data));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        if (requireAuth) {
          router.replace('/');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [requireAuth, router]);

  const refresh = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setUser(json.data);
          localStorage.setItem('user', JSON.stringify(json.data));
        }
      } catch {
        // ignore refresh errors
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await authLogout();
    setUser(null);
    router.replace('/');
  }, [router]);

  return { user, loading, logout: handleLogout, refresh };
}
