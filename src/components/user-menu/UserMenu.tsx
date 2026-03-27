'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { type UserInfo } from '@/lib/auth';

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
      case 'SUPER_ADMIN': return 'bg-[rgba(200,169,110,0.15)] text-gold-dark';
      case 'SELLER': return 'bg-[rgba(34,139,34,0.1)] text-[#2d7a2d]';
      default: return 'bg-[rgba(59,130,246,0.1)] text-[#2563eb]';
    }
  }

  function getRoleLabel() {
    switch (role) {
      case 'SUPER_ADMIN': return 'Admin';
      case 'SELLER': return 'Seller';
      default: return 'Buyer';
    }
  }

  const menuItemCls = "flex items-center gap-[1rem] w-full py-[0.625rem] px-[1.5rem] font-body text-[0.875rem] text-slate bg-transparent border-none cursor-pointer transition-all duration-[200ms] no-underline hover:bg-ivory hover:text-charcoal";
  const menuIconCls = "text-[1rem] w-[20px] text-center shrink-0";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-[0.5rem] py-[0.375rem] pr-[0.75rem] pl-[0.375rem] bg-white border border-border-light rounded-full cursor-pointer transition-all duration-[200ms] font-body hover:border-border hover:shadow-subtle max-sm:p-[0.375rem]"
        onClick={() => setOpen(!open)}
      >
        <div className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center font-display text-[0.875rem] font-medium shrink-0 overflow-hidden">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : initials}
        </div>
        <span className="text-[0.875rem] font-medium text-charcoal max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap max-sm:hidden">{displayName}</span>
        <span className={`text-[0.625rem] text-muted transition-transform duration-[200ms] ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 min-w-[240px] bg-white border border-border-light rounded-[12px] shadow-elevated py-[0.5rem] animate-scale-in z-[200] max-sm:right-[-8px] max-sm:min-w-[220px]">
          {/* User Info */}
          <div className="py-[1rem] px-[1.5rem] border-b border-border-light mb-[0.25rem]">
            <p className="font-display text-[1rem] font-medium text-charcoal">{displayName}</p>
            <p className="text-[0.75rem] text-muted mt-[2px]">{user.email}</p>
            <span className={`inline-block mt-[0.25rem] py-[2px] px-[8px] text-[0.6875rem] font-semibold tracking-[0.05em] uppercase rounded-[4px] ${getRoleBadgeClass()}`}>
              {getRoleLabel()}
            </span>
          </div>

          {/* Dashboard — admin & seller only */}
          {role !== 'BUYER' && (
            <div className="py-[0.25rem] border-t border-border-light">
              <Link href="/dashboard" className={menuItemCls} onClick={() => setOpen(false)}>
                <span className={menuIconCls}>◎</span>
                <span className="flex-1 text-left">Dashboard</span>
              </Link>
            </div>
          )}

          {/* Admin-specific */}
          {role === 'SUPER_ADMIN' && (
            <div className="py-[0.25rem] border-t border-border-light">
              <Link href="/dashboard/admin" className={menuItemCls} onClick={() => setOpen(false)}>
                <span className={menuIconCls}>⚙</span>
                <span className="flex-1 text-left">Admin Management</span>
              </Link>
              <Link href="/dashboard/admin/users" className={menuItemCls} onClick={() => setOpen(false)}>
                <span className={menuIconCls}>◇</span>
                <span className="flex-1 text-left">User Management</span>
              </Link>
            </div>
          )}

          {/* Shopping — all roles */}
          <div className="py-[0.25rem] border-t border-border-light">
            <Link href="/orders" className={menuItemCls} onClick={() => setOpen(false)}>
              <span className={menuIconCls}>□</span>
              <span className="flex-1 text-left">My Orders</span>
            </Link>
            <Link href="/cart" className={menuItemCls} onClick={() => setOpen(false)}>
              <span className={menuIconCls}>▣</span>
              <span className="flex-1 text-left">Cart</span>
            </Link>
          </div>

          {/* Seller-specific */}
          {role === 'SELLER' && (
            <div className="py-[0.25rem] border-t border-border-light">
              <Link href="/dashboard/products/my" className={menuItemCls} onClick={() => setOpen(false)}>
                <span className={menuIconCls}>◇</span>
                <span className="flex-1 text-left">My Products</span>
              </Link>
              <Link href="/dashboard/orders/sales" className={menuItemCls} onClick={() => setOpen(false)}>
                <span className={menuIconCls}>□</span>
                <span className="flex-1 text-left">Sales</span>
              </Link>
            </div>
          )}

          {/* Settings & Logout */}
          <div className="py-[0.25rem] border-t border-border-light">
            <Link
              href={role === 'BUYER' ? '/settings' : '/dashboard/settings'}
              className={menuItemCls}
              onClick={() => setOpen(false)}
            >
              <span className={menuIconCls}>⚙</span>
              <span className="flex-1 text-left">Settings</span>
            </Link>
            <button
              type="button"
              className={`${menuItemCls} !text-error hover:!bg-[#fef2f2] hover:!text-error`}
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <span className={menuIconCls}>↗</span>
              <span className="flex-1 text-left">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
