'use client';

import { useState, useRef, useEffect } from 'react';
import type { AdminUser } from '@/lib/admin';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import styles from './admin.module.css';

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
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={styles.skeleton} style={{ width: '160px' }} /></td>
          <td><div className={styles.skeleton} style={{ width: '60px' }} /></td>
          <td><div className={styles.skeleton} style={{ width: '70px' }} /></td>
          <td><div className={styles.skeleton} style={{ width: '90px' }} /></td>
          <td><div className={styles.skeleton} style={{ width: '32px' }} /></td>
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
    <div className={styles.kebabContainer} ref={ref}>
      <button
        type="button"
        className={styles.kebabBtn}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User actions"
      >
        &#x22EE;
      </button>
      {open && (
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => { setOpen(false); onEditUser(user); }}
          >
            Edit User
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => { setOpen(false); onChangeRole(user); }}
          >
            Change Role
          </button>
          <button
            type="button"
            className={styles.dropdownItem}
            onClick={() => { setOpen(false); onResetPassword(user); }}
          >
            Reset Password
          </button>
          <div className={styles.dropdownDivider} />
          <button
            type="button"
            className={`${styles.dropdownItem} ${isSuspended ? styles.dropdownItemSuccess : styles.dropdownItemDanger}`}
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
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="User list">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col" className={styles.colRegistered}>Joined</th>
              <th scope="col" className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody aria-busy={loading}>
            {loading ? (
              <SkeletonRows />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <div className={styles.emptyState} role="status">
                    <div className={styles.emptyIcon}>&#x2014;</div>
                    <p className={styles.emptyTitle}>No users found</p>
                    <p className={styles.emptySubtitle}>
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatarSmall}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td className={`${styles.colRegistered} ${styles.emailCell}`}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className={styles.colActions}>
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
      <div className={styles.cardList}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.userCard}>
              <div className={styles.skeleton} style={{ width: '60%', height: '16px' }} />
              <div className={styles.skeleton} style={{ width: '80%', height: '14px', marginTop: '8px' }} />
              <div className={styles.skeleton} style={{ width: '40%', height: '14px', marginTop: '8px' }} />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <div className={styles.emptyIcon}>&#x2014;</div>
            <p className={styles.emptyTitle}>No users found</p>
            <p className={styles.emptySubtitle}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.cardTop}>
                <div className={styles.userCell}>
                  <div className={styles.userAvatarSmall}>
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={styles.cardName}>{user.name}</p>
                    <p className={styles.cardEmail}>{user.email}</p>
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
              <div className={styles.cardMiddle}>
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardDate}>
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
