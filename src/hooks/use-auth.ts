'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUser,
  isLoggedIn,
  logout as authLogout,
  refreshTokens,
  isRefreshNeeded,
  type UserInfo,
} from '@/lib/auth';

const AUTO_REFRESH_CHECK_MS = 60 * 60 * 1000; // check every 1 hour

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef(false);

  const tryAutoRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    if (!isLoggedIn() || !isRefreshNeeded()) return;
    refreshingRef.current = true;
    try {
      await refreshTokens();
    } catch {
      await authLogout();
      router.replace('/');
    } finally {
      refreshingRef.current = false;
    }
  }, [router]);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    if (requireAuth && !loggedIn) {
      router.replace('/');
      return;
    }
    if (loggedIn) {
      setUser(getUser());
      // Auto-refresh on mount if needed
      tryAutoRefresh();
    }
    setLoading(false);
  }, [requireAuth, router, tryAutoRefresh]);

  // Periodic auto-refresh check
  useEffect(() => {
    if (!isLoggedIn()) return;
    const interval = setInterval(tryAutoRefresh, AUTO_REFRESH_CHECK_MS);
    return () => clearInterval(interval);
  }, [tryAutoRefresh]);

  const refresh = useCallback(() => {
    setUser(getUser());
  }, []);

  async function handleLogout() {
    await authLogout();
    router.replace('/');
  }

  return { user, loading, logout: handleLogout, refresh };
}
