'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, isLoggedIn } from '@/lib/auth';

const ADMIN_NAV_ITEMS = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/users', label: 'Users' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  function checkAuth() {
    if (!isLoggedIn()) {
      setAuthorized(false);
      setChecking(false);
      window.dispatchEvent(new CustomEvent('session-expired'));
      return;
    }

    const user = getUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }

  useEffect(() => {
    checkAuth();
  }, [router]);

  // Re-check auth when session is restored (user re-logged in)
  useEffect(() => {
    function handleSessionRestored() {
      checkAuth();
    }
    window.addEventListener('session-restored', handleSessionRestored);
    return () => window.removeEventListener('session-restored', handleSessionRestored);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-[24px] h-[24px] border-[2px] border-border-light border-t-charcoal rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div>
      <nav className="flex items-center gap-[0.25rem] mb-[2rem] border-b border-border-light pb-0">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium no-underline border-b-[2px] mb-[-1px] transition-all duration-[200ms] ${isActive ? 'text-charcoal border-b-charcoal' : 'text-muted border-b-transparent hover:text-charcoal'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
