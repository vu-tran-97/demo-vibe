'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isLoggedIn, logout as authLogout, type UserInfo } from '@/lib/auth';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    if (requireAuth && !loggedIn) {
      router.replace('/');
      return;
    }
    if (loggedIn) {
      setUser(getUser());
    }
    setLoading(false);
  }, [requireAuth, router]);

  const refresh = useCallback(() => {
    setUser(getUser());
  }, []);

  async function handleLogout() {
    await authLogout();
    router.replace('/');
  }

  return { user, loading, logout: handleLogout, refresh };
}
