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
    <div className="flex flex-col gap-[2rem]">
      <div className="flex items-start justify-between gap-[1.5rem] max-sm:flex-col max-sm:gap-[1rem]">
        <div>
          <h1 className="font-display text-[1.5rem] font-normal text-charcoal tracking-[-0.02em]">User Management</h1>
          <p className="text-[0.8125rem] text-muted mt-[0.25rem] tracking-[0.02em]">
            Manage all platform users, roles, and account statuses
          </p>
        </div>
        <div className="flex items-center gap-[0.5rem]">
          <button
            type="button"
            className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap flex items-center gap-[0.5rem] hover:bg-ivory hover:border-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap no-underline inline-flex items-center hover:bg-charcoal-light disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="bg-white border border-border-light rounded-[12px] overflow-hidden">
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
        <div
          className="fixed inset-0 z-100 bg-[rgba(26,26,26,0.4)] flex items-center justify-center p-[1.5rem] animate-fade-in backdrop-blur-[4px]"
          onClick={() => setEditModalUser(null)}
        >
          <div
            className="bg-white rounded-[12px] shadow-medium max-w-[480px] w-full animate-scale-in overflow-hidden max-sm:max-w-full max-sm:m-[1.5rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[2rem] py-[1.5rem] border-b border-border-light">
              <h3 className="font-display text-[1.125rem] font-normal text-charcoal">Edit User</h3>
              <button
                type="button"
                className="w-[32px] h-[32px] flex items-center justify-center text-[0.875rem] text-muted bg-transparent border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory"
                onClick={() => setEditModalUser(null)}
              >
                &#x2715;
              </button>
            </div>
            <div className="flex flex-col gap-[1.5rem] p-[2rem]">
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">Email</label>
                <input
                  type="email"
                  className="py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-muted bg-ivory outline-none transition-[border-color] duration-[200ms] cursor-not-allowed"
                  value={editModalUser.email}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  className="py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none transition-[border-color] duration-[200ms] placeholder:text-muted focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.04)]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">Nickname</label>
                <input
                  type="text"
                  className="py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none transition-[border-color] duration-[200ms] placeholder:text-muted focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.04)]"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="Nickname (optional)"
                />
              </div>
              <div className="flex justify-end gap-[1rem] pt-[0.5rem]">
                <button
                  type="button"
                  className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setEditModalUser(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap no-underline inline-flex items-center hover:bg-charcoal-light disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div
          className="fixed inset-0 z-100 bg-[rgba(26,26,26,0.4)] flex items-center justify-center p-[1.5rem] animate-fade-in backdrop-blur-[4px]"
          onClick={() => setRoleModalUser(null)}
        >
          <div
            className="bg-white rounded-[12px] shadow-medium p-[2rem] max-w-[420px] w-full animate-scale-in max-sm:max-w-full max-sm:m-[1.5rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[1.125rem] font-normal text-charcoal mb-[0.5rem]">Change Role</h3>
            <p className="text-[0.8125rem] text-slate leading-[1.6] mb-[2rem]">
              Change the role for <strong>{roleModalUser.name}</strong> ({roleModalUser.email}).
              This will affect the user&apos;s access permissions.
            </p>
            <div className="flex flex-col gap-[0.25rem]">
              <label className="text-[0.8125rem] font-medium text-charcoal">New Role</label>
              <select
                className="py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none cursor-pointer transition-[border-color] duration-[200ms] focus:border-charcoal"
                value={roleModalValue}
                onChange={(e) => setRoleModalValue(e.target.value)}
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
            </div>
            <div className="flex justify-end gap-[1rem] mt-[2rem]">
              <button
                type="button"
                className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setRoleModalUser(null)}
                disabled={roleModalLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] bg-gold-dark hover:enabled:bg-gold disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div
          className="fixed inset-0 z-100 bg-[rgba(26,26,26,0.4)] flex items-center justify-center p-[1.5rem] animate-fade-in backdrop-blur-[4px]"
          onClick={() => setPasswordModalUser(null)}
        >
          <div
            className="bg-white rounded-[12px] shadow-medium max-w-[480px] w-full animate-scale-in overflow-hidden max-sm:max-w-full max-sm:m-[1.5rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[2rem] py-[1.5rem] border-b border-border-light">
              <h3 className="font-display text-[1.125rem] font-normal text-charcoal">Reset Password</h3>
              <button
                type="button"
                className="w-[32px] h-[32px] flex items-center justify-center text-[0.875rem] text-muted bg-transparent border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory"
                onClick={() => setPasswordModalUser(null)}
              >
                &#x2715;
              </button>
            </div>
            <div className="flex flex-col gap-[1.5rem] p-[2rem]">
              <p className="text-[0.8125rem] text-slate leading-[1.6]">
                Reset the password for <strong>{passwordModalUser.name}</strong> ({passwordModalUser.email}).
              </p>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">
                  New Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  className={`py-[0.5rem] px-[0.875rem] border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none transition-[border-color] duration-[200ms] placeholder:text-muted ${passwordError ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(196,91,91,0.1)]' : 'border-border focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.04)]'}`}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  className={`py-[0.5rem] px-[0.875rem] border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none transition-[border-color] duration-[200ms] placeholder:text-muted ${passwordError ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(196,91,91,0.1)]' : 'border-border focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.04)]'}`}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Confirm new password"
                />
              </div>
              {passwordError && (
                <p className="text-[0.75rem] text-error">{passwordError}</p>
              )}
              <div className="flex justify-end gap-[1rem] pt-[0.5rem]">
                <button
                  type="button"
                  className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-white border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPasswordModalUser(null)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] whitespace-nowrap no-underline inline-flex items-center hover:bg-charcoal-light disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed top-[2rem] right-[2rem] z-200 flex flex-col gap-[0.5rem] pointer-events-none max-sm:top-[1.5rem] max-sm:right-[1.5rem] max-sm:left-[1.5rem]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-[0.5rem] py-[1rem] px-[1.5rem] rounded-[8px] text-[0.8125rem] font-medium shadow-medium animate-toast-in pointer-events-auto ${toast.type === 'success' ? 'bg-white text-success border border-[rgba(90,138,106,0.2)]' : 'bg-white text-error border border-[rgba(196,91,91,0.2)]'}`}
              role="alert"
            >
              <span className="text-[0.875rem] shrink-0">
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
