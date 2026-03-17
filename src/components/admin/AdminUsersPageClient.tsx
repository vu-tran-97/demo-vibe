'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminUsers,
  changeUserRole,
  changeUserStatus,
  resetUserPassword,
  updateUser,
  exportUsersCsv,
  type AdminUser,
  type PaginationInfo,
} from '@/lib/admin';
import { AdminUserFilters } from './AdminUserFilters';
import { AdminUserTable } from './AdminUserTable';
import { AdminCreateUserModal } from './AdminCreateUserModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import { Pagination } from './Pagination';
import styles from './admin.module.css';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastIdCounter = 0;

export function AdminUsersPageClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Export loading state
  const [exporting, setExporting] = useState(false);

  // Edit user modal state
  const [editModalUser, setEditModalUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change role modal state
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [roleModalValue, setRoleModalValue] = useState('');
  const [roleModalLoading, setRoleModalLoading] = useState(false);

  // Reset password modal state
  const [passwordModalUser, setPasswordModalUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning';
    action: (() => Promise<void>) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '',
    variant: 'warning',
    action: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(type: 'success' | 'error', message: string) {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data.items);
      setPagination(data.pagination);
    } catch {
      addToast('error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reload data after session is restored
  useEffect(() => {
    function handleSessionRestored() {
      loadUsers();
    }
    window.addEventListener('session-restored', handleSessionRestored);
    return () => window.removeEventListener('session-restored', handleSessionRestored);
  }, [loadUsers]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  // Edit user handlers
  function handleEditUser(user: AdminUser) {
    setEditModalUser(user);
    setEditName(user.name);
    setEditNickname(user.nickname || '');
  }

  async function handleEditSubmit() {
    if (!editModalUser) return;
    setEditLoading(true);
    try {
      await updateUser(editModalUser.id, {
        name: editName,
        nickname: editNickname || undefined,
      });
      addToast('success', 'User updated successfully');
      setEditModalUser(null);
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      addToast('error', message);
    } finally {
      setEditLoading(false);
    }
  }

  // Change role handlers
  function handleChangeRole(user: AdminUser) {
    setRoleModalUser(user);
    setRoleModalValue(user.role === 'SELLER' ? 'BUYER' : 'SELLER');
  }

  async function handleRoleSubmit() {
    if (!roleModalUser) return;
    setRoleModalLoading(true);
    try {
      await changeUserRole(roleModalUser.id, roleModalValue);
      addToast('success', `Role changed to ${roleModalValue}`);
      setRoleModalUser(null);
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Role change failed';
      addToast('error', message);
    } finally {
      setRoleModalLoading(false);
    }
  }

  // Reset password handlers
  function handleResetPassword(user: AdminUser) {
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }

  async function handlePasswordSubmit() {
    if (!passwordModalUser) return;
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    setPasswordLoading(true);
    try {
      await resetUserPassword(passwordModalUser.id, newPassword);
      addToast('success', 'Password reset successfully');
      setPasswordModalUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      addToast('error', message);
    } finally {
      setPasswordLoading(false);
    }
  }

  // Change status handler
  function handleChangeStatus(user: AdminUser) {
    const isSuspend = user.status === 'ACTV';
    setConfirmModal({
      isOpen: true,
      title: isSuspend ? 'Suspend User' : 'Activate User',
      message: isSuspend
        ? `Suspend ${user.name}? The user will be logged out immediately and unable to sign in.`
        : `Reactivate ${user.name}? The user will be able to sign in again.`,
      confirmLabel: isSuspend ? 'Suspend' : 'Activate',
      variant: isSuspend ? 'danger' : 'warning',
      action: async () => {
        const newStatus = isSuspend ? 'SUSP' : 'ACTV';
        await changeUserStatus(user.id, newStatus);
        addToast(
          'success',
          isSuspend ? 'User has been suspended' : 'User has been reactivated',
        );
        loadUsers();
      },
    });
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const blob = await exportUsersCsv({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'CSV exported successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      addToast('error', message);
    } finally {
      setExporting(false);
    }
  }

  async function handleConfirm() {
    if (!confirmModal.action) return;
    setConfirmLoading(true);
    try {
      await confirmModal.action();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Action failed';
      addToast('error', message);
    } finally {
      setConfirmLoading(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false, action: null }));
    }
  }

  function handleConfirmCancel() {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, action: null }));
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>User Management</h1>
          <p className={styles.pageSubtitle}>
            Manage all platform users, roles, and account statuses
          </p>
        </div>
        <div className={styles.actionBtns}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setIsCreateOpen(true)}
          >
            + New User
          </button>
        </div>
      </div>

      <AdminUserFilters
        search={search}
        role={roleFilter}
        status={statusFilter}
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
      />

      <div className={styles.tableCard}>
        <AdminUserTable
          users={users}
          loading={loading}
          onEditUser={handleEditUser}
          onChangeRole={handleChangeRole}
          onResetPassword={handleResetPassword}
          onChangeStatus={handleChangeStatus}
        />
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />

      <AdminCreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          addToast('success', 'User created successfully');
          loadUsers();
        }}
      />

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />

      {/* Edit User Modal */}
      {editModalUser && (
        <div className={styles.modalOverlay} onClick={() => setEditModalUser(null)}>
          <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createModalHeader}>
              <h3 className={styles.createModalTitle}>Edit User</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setEditModalUser(null)}
              >
                &#x2715;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Email</label>
                <input
                  type="email"
                  className={`${styles.fieldInput} ${styles.fieldInputReadonly}`}
                  value={editModalUser.email}
                  readOnly
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Nickname</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="Nickname (optional)"
                />
              </div>
              <div className={styles.createFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditModalUser(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleEditSubmit}
                  disabled={editLoading || !editName.trim()}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalUser && (
        <div className={styles.modalOverlay} onClick={() => setRoleModalUser(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Change Role</h3>
            <p className={styles.confirmMessage}>
              Change the role for <strong>{roleModalUser.name}</strong> ({roleModalUser.email}).
              This will affect the user&apos;s access permissions.
            </p>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>New Role</label>
              <select
                className={styles.fieldSelect}
                value={roleModalValue}
                onChange={(e) => setRoleModalValue(e.target.value)}
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
            </div>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setRoleModalUser(null)}
                disabled={roleModalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.confirmBtn} ${styles.confirmWarning}`}
                onClick={handleRoleSubmit}
                disabled={roleModalLoading}
              >
                {roleModalLoading ? 'Changing...' : 'Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalUser && (
        <div className={styles.modalOverlay} onClick={() => setPasswordModalUser(null)}>
          <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createModalHeader}>
              <h3 className={styles.createModalTitle}>Reset Password</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPasswordModalUser(null)}
              >
                &#x2715;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Reset the password for <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email}).
              </p>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  New Password <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  className={`${styles.fieldInput} ${passwordError ? styles.fieldInputError : ''}`}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Confirm Password <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  className={`${styles.fieldInput} ${passwordError ? styles.fieldInputError : ''}`}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className={styles.fieldError}>{passwordError}</p>
              )}
              <div className={styles.createFormActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setPasswordModalUser(null)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handlePasswordSubmit}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                >
                  {passwordLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}
              role="alert"
            >
              <span className={styles.toastIcon}>
                {toast.type === 'success' ? '\u2713' : '\u2717'}
              </span>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
