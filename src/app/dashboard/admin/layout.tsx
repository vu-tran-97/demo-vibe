'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUser, isLoggedIn } from '@/lib/auth';
import styles from '@/components/admin/admin.module.css';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--border-light)',
          borderTopColor: 'var(--charcoal)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div>
      <nav className={styles.adminNav}>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.adminNavLink} ${isActive ? styles.adminNavLinkActive : ''}`}
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
