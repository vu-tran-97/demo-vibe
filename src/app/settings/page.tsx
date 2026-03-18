'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  isLoggedIn,
  getUser,
  logout as authLogout,
  updateProfile,
  changePassword,
  deleteAccount,
  AuthError,
  type UserInfo,
} from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';
import layout from '@/app/cart/cart-page.module.css';
import styles from '@/app/dashboard/settings/settings.module.css';

type ToastVariant = 'success' | 'error';
interface ToastState { message: string; variant: ToastVariant; }

export default function SettingsPage() {
  const router = useRouter();
  const { totalItems: cartCount } = useCart();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    const u = getUser();
    setUser(u);
    if (!li) {
      router.replace('/');
      return;
    }
    if (u) {
      setName(u.name ?? '');
      setNickname(u.nickname ?? '');
      setProfileImageUrl(u.profileImageUrl ?? '');
    }
  }, [router]);

  function refreshAuth() {
    setLoggedIn(isLoggedIn());
    const u = getUser();
    setUser(u);
    if (u) {
      setName(u.name ?? '');
      setNickname(u.nickname ?? '');
      setProfileImageUrl(u.profileImageUrl ?? '');
    }
  }

  async function handleLogout() {
    await authLogout();
    setLoggedIn(false);
    setUser(null);
    router.replace('/');
  }

  const showToastMsg = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  }, []);

  function getErrorMessage(err: unknown): string {
    if (err instanceof AuthError) return err.message;
    return 'An unexpected error occurred';
  }

  async function handleSaveProfile() {
    if (!name.trim()) { showToastMsg('Name cannot be empty', 'error'); return; }
    setProfileSaving(true);
    try {
      await updateProfile({ name: name.trim(), nickname: nickname.trim() || undefined, profileImageUrl: profileImageUrl.trim() || undefined });
      refreshAuth();
      showToastMsg('Profile updated successfully');
    } catch (err: unknown) { showToastMsg(getErrorMessage(err), 'error'); }
    finally { setProfileSaving(false); }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) { showToastMsg('Passwords do not match', 'error'); return; }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setShowPasswordSection(false);
      showToastMsg('Password changed successfully');
    } catch (err: unknown) { showToastMsg(getErrorMessage(err), 'error'); }
    finally { setPasswordSaving(false); }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try { await deleteAccount(); router.replace('/'); }
    catch (err: unknown) { showToastMsg(getErrorMessage(err), 'error'); setShowDeleteConfirm(false); }
    finally { setDeleteLoading(false); }
  }

  function getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return styles.roleBadgeAdmin;
      case 'SELLER': return styles.roleBadgeSeller;
      default: return styles.roleBadgeBuyer;
    }
  }

  if (!loggedIn) return null;

  return (
    <div className={layout.page}>
      {/* ── Header ── */}
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <div className={layout.headerLeft}>
            <Link href="/" className={layout.logo}>Vibe</Link>
            <nav className={layout.breadcrumb}>
              <Link href="/" className={layout.breadcrumbLink}>Home</Link>
              <span className={layout.breadcrumbSep}>/</span>
              <span className={layout.breadcrumbCurrent}>Settings</span>
            </nav>
          </div>
          <div className={layout.headerRight}>
            {loggedIn && user ? (
              <>
                <Link href="/cart" className={layout.headerBtn}>
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
                <Link href="/orders" className={layout.headerBtn}>My Orders</Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <button
                type="button"
                className={`${layout.headerBtn} ${layout.headerBtnPrimary}`}
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className={layout.main}>
        <div className={styles.settings}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle} style={{ fontSize: '2.25rem' }}>Settings</h1>
            <p className={styles.pageSubtitle}>Manage your account and preferences</p>
          </div>

          {toast && (
            <div className={`${styles.toast} ${toast.variant === 'error' ? styles.toastError : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {toast.variant === 'success' ? (
                  <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                ) : (
                  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                )}
              </svg>
              {toast.message}
            </div>
          )}

          {/* Profile */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Profile</h3>
            <p className={styles.sectionDesc}>Your personal information</p>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {profileImageUrl ? <img src={profileImageUrl} alt="Profile" className={styles.avatarImage} /> : (user?.name ?? 'U').charAt(0)}
              </div>
              <div className={styles.avatarInfo}>
                <p className={styles.avatarName}>{user?.name ?? 'User'}</p>
                <p className={styles.avatarRole}>{user?.role ?? 'BUYER'}</p>
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input type="text" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nickname</label>
                <input type="text" className={styles.input} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Optional" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profile Image URL</label>
                <input type="url" className={styles.input} value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                <p className={styles.inputHint}>Paste a direct link to your profile image</p>
              </div>
            </div>
            <div className={styles.sectionActions}>
              <button type="button" className={styles.primaryBtn} onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Security */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Security</h3>
                <p className={styles.sectionDesc}>Change your account password</p>
              </div>
              {!showPasswordSection && (
                <button type="button" className={styles.outlineBtn} onClick={() => setShowPasswordSection(true)}>Change Password</button>
              )}
            </div>
            {showPasswordSection && (
              <div className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password</label>
                  <input type="password" className={styles.input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <input type="password" className={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  <p className={styles.inputHint}>Min 8 characters with uppercase, lowercase, number, and special character</p>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password</label>
                  <input type="password" className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && <p className={styles.inputError}>Passwords do not match</p>}
                </div>
                <div className={styles.sectionActions}>
                  <button type="button" className={styles.outlineBtn} onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</button>
                  <button type="button" className={styles.primaryBtn} onClick={handleChangePassword} disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Account */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Account</h3>
            <p className={styles.sectionDesc}>Your account information</p>
            <div className={styles.accountInfoGrid}>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Email</span>
                <span className={styles.accountInfoValue}>{user?.email ?? '--'}</span>
              </div>
              <div className={styles.accountInfoItem}>
                <span className={styles.accountInfoLabel}>Role</span>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(user?.role ?? 'BUYER')}`}>{user?.role ?? 'BUYER'}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className={`${styles.section} ${styles.dangerSection}`}>
            <h3 className={styles.sectionTitle}>Danger Zone</h3>
            <p className={styles.sectionDesc}>Irreversible actions</p>
            <div className={styles.dangerActions}>
              <div className={styles.dangerItem}>
                <div><p className={styles.dangerLabel}>Log out of all devices</p><p className={styles.dangerDesc}>Revoke all active sessions</p></div>
                <button type="button" className={styles.dangerBtn} onClick={handleLogout}>Log Out All</button>
              </div>
              <div className={styles.dangerItem}>
                <div><p className={styles.dangerLabel}>Delete account</p><p className={styles.dangerDesc}>Permanently remove your account and all data</p></div>
                <button type="button" className={`${styles.dangerBtn} ${styles.dangerBtnRed}`} onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
              </div>
            </div>
          </section>

          {/* Delete Confirm Modal */}
          {showDeleteConfirm && (
            <div className={styles.modalOverlay} onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className={styles.modalTitle}>Delete your account?</h3>
                <p className={styles.modalDesc}>This action cannot be undone. All your data, orders, and messages will be permanently deleted.</p>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.outlineBtn} onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>Cancel</button>
                  <button type="button" className={`${styles.dangerBtn} ${styles.dangerBtnRed}`} onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={layout.footer}>
        <div className={layout.footerInner}>
          <div className={layout.footerGrid}>
            <div className={layout.footerBrand}>
              <div className={layout.footerLogo}>Vibe</div>
              <p className={layout.footerTagline}>
                A curated marketplace where every product tells a story and every interaction feels personal.
              </p>
            </div>
            <div className={layout.footerSection}>
              <h4>Shop</h4>
              <ul className={layout.footerLinks}>
                <li><Link href="/">All Products</Link></li>
                <li><Link href="/">New Arrivals</Link></li>
                <li><Link href="/">Best Sellers</Link></li>
                <li><Link href="/">Sale</Link></li>
              </ul>
            </div>
            <div className={layout.footerSection}>
              <h4>Support</h4>
              <ul className={layout.footerLinks}>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Shipping Info</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            <div className={layout.footerSection}>
              <h4>Company</h4>
              <ul className={layout.footerLinks}>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className={layout.footerBottom}>
            <span>&copy; 2026 Vibe. All rights reserved.</span>
            <div className={layout.footerPayments}>
              Visa &middot; Mastercard &middot; Bank Transfer
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView="login"
        onSuccess={() => { setAuthModalOpen(false); refreshAuth(); }}
        stayOnPage
      />
      <ToastContainer />
    </div>
  );
}
