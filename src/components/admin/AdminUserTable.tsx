'use client';

import { useState, useRef, useEffect } from 'react';
import type { AdminUser } from '@/lib/admin';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';

interface AdminUserTableProps {
  users: AdminUser[];
  loading: boolean;
  onEditUser: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="[&_td]:p-[1.5rem_2rem]">
          <td><div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '160px' }} /></td>
          <td><div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '60px' }} /></td>
          <td><div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '70px' }} /></td>
          <td><div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '90px' }} /></td>
          <td><div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '32px' }} /></td>
        </tr>
      ))}
    </>
  );
}

function KebabMenu({
  user,
  onEditUser,
  onChangeRole,
  onResetPassword,
  onChangeStatus,
}: {
  user: AdminUser;
  onEditUser: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isSuspended = user.status === 'SUSP' || user.status === 'INAC';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-[32px] h-[32px] flex items-center justify-center text-[1.125rem] text-muted bg-transparent border border-transparent rounded-full cursor-pointer transition-all duration-[200ms] leading-[1] hover:text-charcoal hover:bg-ivory hover:border-border"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User actions"
      >
        &#x22EE;
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-border rounded-[8px] shadow-medium min-w-[180px] z-50 py-[0.25rem] animate-[fadeIn_100ms_ease]">
          <button
            type="button"
            className="block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] text-charcoal bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] hover:bg-ivory"
            onClick={() => { setOpen(false); onEditUser(user); }}
          >
            Edit User
          </button>
          <button
            type="button"
            className="block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] text-charcoal bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] hover:bg-ivory"
            onClick={() => { setOpen(false); onChangeRole(user); }}
          >
            Change Role
          </button>
          <button
            type="button"
            className="block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] text-charcoal bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] hover:bg-ivory"
            onClick={() => { setOpen(false); onResetPassword(user); }}
          >
            Reset Password
          </button>
          <div className="h-px bg-border-light my-[0.25rem]" />
          <button
            type="button"
            className={`block w-full text-left py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] bg-transparent border-none cursor-pointer transition-[background] duration-[200ms] ${
              isSuspended
                ? 'text-success hover:bg-[rgba(90,138,106,0.06)] hover:text-success'
                : 'text-error hover:bg-[rgba(196,91,91,0.06)] hover:text-error'
            }`}
            onClick={() => { setOpen(false); onChangeStatus(user); }}
          >
            {isSuspended ? 'Activate' : 'Suspend'}
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminUserTable({
  users,
  loading,
  onEditUser,
  onChangeRole,
  onResetPassword,
  onChangeStatus,
}: AdminUserTableProps) {
  return (
    <>
      {/* Desktop / Tablet table */}
      <div className="max-sm:hidden">
        <table className="w-full border-collapse [&_th]:text-left [&_th]:p-[1rem_2rem] [&_th]:text-[0.75rem] [&_th]:font-medium [&_th]:text-muted [&_th]:tracking-[0.05em] [&_th]:uppercase [&_th]:bg-ivory [&_td]:p-[1rem_2rem] [&_td]:text-[0.875rem] [&_td]:text-charcoal [&_td]:border-b [&_td]:border-border-light [&_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0" aria-label="User list">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col" className="max-md:hidden">Joined</th>
              <th scope="col" className="w-[60px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody aria-busy={loading}>
            {loading ? (
              <SkeletonRows />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="!text-center !p-[4rem_1.5rem]">
                  <div className="flex flex-col items-center gap-[0.5rem] py-[3rem] px-[1.5rem]" role="status">
                    <div className="text-[2.5rem] text-muted opacity-40">&#x2014;</div>
                    <p className="font-display text-[1.125rem] font-normal text-slate">No users found</p>
                    <p className="text-[0.8125rem] text-muted">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-[background] duration-[200ms] hover:[&_td]:bg-[rgba(250,250,247,0.5)]">
                  <td>
                    <div className="flex items-center gap-[1rem]">
                      <div className="w-[36px] h-[36px] rounded-full bg-ivory-warm text-gold flex items-center justify-center font-display text-[0.875rem] font-medium shrink-0">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-px min-w-0">
                        <span className="text-[0.875rem] font-medium text-charcoal whitespace-nowrap">{user.name}</span>
                        <span className="text-[0.75rem] text-muted whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="max-md:hidden text-[0.8125rem] text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="w-[60px] text-center">
                    <KebabMenu
                      user={user}
                      onEditUser={onEditUser}
                      onChangeRole={onChangeRole}
                      onResetPassword={onResetPassword}
                      onChangeStatus={onChangeStatus}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="hidden max-sm:block">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-[1.5rem] border-b border-border-light last:border-b-0">
              <div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '60%', height: '16px' }} />
              <div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '80%', height: '14px', marginTop: '8px' }} />
              <div className="h-[14px] bg-ivory-warm rounded-[4px] animate-pulse" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-[0.5rem] py-[3rem] px-[1.5rem]" role="status">
            <div className="text-[2.5rem] text-muted opacity-40">&#x2014;</div>
            <p className="font-display text-[1.125rem] font-normal text-slate">No users found</p>
            <p className="text-[0.8125rem] text-muted">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-[1.5rem] border-b border-border-light last:border-b-0">
              <div className="flex items-start justify-between mb-[1rem]">
                <div className="flex items-center gap-[1rem]">
                  <div className="w-[36px] h-[36px] rounded-full bg-ivory-warm text-gold flex items-center justify-center font-display text-[0.875rem] font-medium shrink-0">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[0.875rem] font-medium text-charcoal">{user.name}</p>
                    <p className="text-[0.75rem] text-muted mt-[2px]">{user.email}</p>
                  </div>
                </div>
                <KebabMenu
                  user={user}
                  onEditUser={onEditUser}
                  onChangeRole={onChangeRole}
                  onResetPassword={onResetPassword}
                  onChangeStatus={onChangeStatus}
                />
              </div>
              <div className="flex items-center gap-[1rem] mb-[1rem]">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.75rem] text-muted">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
