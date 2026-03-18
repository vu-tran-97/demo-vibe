'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { type UserInfo } from '@/lib/auth';
import styles from './user-menu.module.css';

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = user.nickname || user.name || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const role = user.role;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getRoleBadgeClass() {
    switch (role) {
      case 'SUPER_ADMIN': return styles.roleSuperAdmin;
      case 'SELLER': return styles.roleSeller;
      default: return styles.roleBuyer;
    }
  }

  function getRoleLabel() {
    switch (role) {
      case 'SUPER_ADMIN': return 'Admin';
      case 'SELLER': return 'Seller';
      default: return 'Buyer';
    }
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
      >
        <div className={styles.avatar}>
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={displayName} className={styles.avatarImg} />
          ) : initials}
        </div>
        <span className={styles.triggerName}>{displayName}</span>
        <span className={`${styles.triggerArrow} ${open ? styles.triggerArrowOpen : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {/* User Info */}
          <div className={styles.userSection}>
            <p className={styles.userName}>{displayName}</p>
            <p className={styles.userEmail}>{user.email}</p>
            <span className={`${styles.roleBadge} ${getRoleBadgeClass()}`}>
              {getRoleLabel()}
            </span>
          </div>

          {/* Dashboard — admin & seller only */}
          {role !== 'BUYER' && (
            <div className={styles.menuSection}>
              <Link
                href="/dashboard"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>◎</span>
                <span className={styles.menuLabel}>Dashboard</span>
              </Link>
            </div>
          )}

          {/* Admin-specific */}
          {role === 'SUPER_ADMIN' && (
            <div className={styles.menuSection}>
              <Link
                href="/dashboard/admin"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>⚙</span>
                <span className={styles.menuLabel}>Admin Management</span>
              </Link>
              <Link
                href="/dashboard/admin/users"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>◇</span>
                <span className={styles.menuLabel}>User Management</span>
              </Link>
            </div>
          )}

          {/* Shopping — all roles */}
          <div className={styles.menuSection}>
            <Link
              href="/orders"
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              <span className={styles.menuIcon}>□</span>
              <span className={styles.menuLabel}>My Orders</span>
            </Link>
            <Link
              href="/cart"
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              <span className={styles.menuIcon}>▣</span>
              <span className={styles.menuLabel}>Cart</span>
            </Link>
          </div>

          {/* Seller-specific */}
          {role === 'SELLER' && (
            <div className={styles.menuSection}>
              <Link
                href="/dashboard/products/my"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>◇</span>
                <span className={styles.menuLabel}>My Products</span>
              </Link>
              <Link
                href="/dashboard/orders/sales"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.menuIcon}>□</span>
                <span className={styles.menuLabel}>Sales</span>
              </Link>
            </div>
          )}

          {/* Settings & Logout */}
          <div className={styles.menuSection}>
            <Link
              href={role === 'BUYER' ? '/settings' : '/dashboard/settings'}
              className={styles.menuItem}
              onClick={() => setOpen(false)}
            >
              <span className={styles.menuIcon}>⚙</span>
              <span className={styles.menuLabel}>Settings</span>
            </Link>
            <button
              type="button"
              className={`${styles.menuItem} ${styles.logoutItem}`}
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <span className={styles.menuIcon}>↗</span>
              <span className={styles.menuLabel}>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
