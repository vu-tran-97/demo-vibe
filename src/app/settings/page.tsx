'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  isLoggedIn,
  getUser,
  logout as authLogout,
  updateProfile,
  deleteAccount,
  AuthError,
  type UserInfo,
} from '@/lib/auth';
import { useCart } from '@/hooks/use-cart';
import { UserMenu } from '@/components/user-menu/UserMenu';
import { AuthModal } from '@/components/auth-modal/AuthModal';
import { ToastContainer } from '@/components/toast/Toast';

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
      const { auth } = await import('@/lib/firebase');
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('Not authenticated');
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setShowPasswordSection(false);
      showToastMsg('Password changed successfully');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
        showToastMsg('Current password is incorrect', 'error');
      } else {
        showToastMsg(getErrorMessage(err), 'error');
      }
    }
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
      case 'ADMIN': return 'bg-[rgba(200,80,80,0.06)] text-error';
      case 'SELLER': return 'bg-[rgba(180,160,100,0.1)] text-gold-dark';
      default: return 'bg-[rgba(90,138,106,0.08)] text-success';
    }
  }

  if (!loggedIn) return null;

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      {/* ── Header ── */}
      <header className="sticky top-0 z-100 bg-white border-b border-border-light shadow-subtle">
        <div className="max-w-[1280px] mx-auto py-[0.75rem] px-[2rem] flex items-center justify-between max-sm:px-[1rem]">
          <div className="flex items-center gap-[2rem]">
            <Link href="/" className="font-display text-[1.75rem] font-semibold text-gold-dark tracking-[-0.03em] no-underline">Vibe</Link>
            <nav className="flex items-center gap-[0.5rem] text-[0.8125rem] text-muted max-sm:hidden">
              <Link href="/" className="text-slate no-underline transition-colors duration-[200ms] hover:text-gold-dark">Home</Link>
              <span className="opacity-40">/</span>
              <span className="text-charcoal font-medium">Settings</span>
            </nav>
          </div>
          <div className="flex items-center gap-[1rem] ml-auto shrink-0">
            {loggedIn && user ? (
              <>
                <Link href="/cart" className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-slate bg-none border border-border rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:text-charcoal hover:border-charcoal">
                  Cart{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
                <Link href="/orders" className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-slate bg-none border border-border rounded-[8px] cursor-pointer no-underline transition-all duration-[200ms] hover:text-charcoal hover:border-charcoal">My Orders</Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <button
                type="button"
                className="flex items-center gap-[0.25rem] py-[0.5rem] px-[1rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border border-charcoal rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-charcoal-light hover:border-charcoal-light hover:text-white"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto py-[3rem] px-[2rem] max-sm:py-[1.5rem] max-sm:px-[1rem]">
        <div className="flex flex-col gap-[2rem] max-w-[720px] max-sm:max-w-full">
          <div className="mb-[0.5rem]">
            <h1 className="font-display text-[2.25rem] font-normal">Settings</h1>
            <p className="text-[0.8125rem] text-muted mt-[2px]">Manage your account and preferences</p>
          </div>

          {toast && (
            <div className={`flex items-center gap-[0.5rem] py-[0.75rem] px-[1rem] rounded-[8px] text-[0.8125rem] font-medium animate-fade-in ${toast.variant === 'error' ? 'bg-[rgba(200,80,80,0.06)] text-error border border-[rgba(200,80,80,0.2)]' : 'bg-[rgba(90,138,106,0.08)] text-success border border-[rgba(90,138,106,0.2)]'}`}>
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
          <section className="bg-white border border-border-light rounded-[12px] p-[2rem] max-sm:p-[1.5rem]">
            <h3 className="font-body text-[1rem] font-semibold text-charcoal mb-[2px]">Profile</h3>
            <p className="text-[0.8125rem] text-muted mb-[1.5rem]">Your personal information</p>
            <div className="flex items-center gap-[1.5rem] mb-[2rem] pb-[1.5rem] border-b border-border-light max-sm:flex-col max-sm:items-start">
              <div className="w-[64px] h-[64px] rounded-full bg-[linear-gradient(135deg,var(--color-ivory-warm)_0%,var(--color-border)_100%)] flex items-center justify-center font-display text-[1.5rem] font-normal text-charcoal shrink-0 overflow-hidden">
                {profileImageUrl ? <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : (user?.name ?? 'U').charAt(0)}
              </div>
              <div className="flex flex-col gap-[2px]">
                <p className="text-[1rem] font-medium text-charcoal">{user?.name ?? 'User'}</p>
                <p className="text-[0.75rem] text-gold-dark font-medium uppercase tracking-[0.05em]">{user?.role ?? 'BUYER'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-[1.5rem]">
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">Full Name</label>
                <input type="text" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">Nickname</label>
                <input type="text" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label className="text-[0.8125rem] font-medium text-charcoal">Profile Image URL</label>
                <input type="url" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                <p className="text-[0.75rem] text-muted mt-[2px]">Paste a direct link to your profile image</p>
              </div>
            </div>
            <div className="flex gap-[0.5rem] justify-end mt-[1.5rem]">
              <button type="button" className="py-[0.625rem] px-[1.5rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-[1px] hover:not-disabled:shadow-soft disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white border border-border-light rounded-[12px] p-[2rem] max-sm:p-[1.5rem]">
            <div className="flex items-start justify-between max-sm:flex-col max-sm:gap-[1rem]">
              <div>
                <h3 className="font-body text-[1rem] font-semibold text-charcoal mb-[2px]">Security</h3>
                <p className="text-[0.8125rem] text-muted mb-[1.5rem]">Change your account password</p>
              </div>
              {!showPasswordSection && (
                <button type="button" className="py-[0.625rem] px-[1.25rem] bg-transparent text-slate border border-border rounded-[8px] font-body text-[0.8125rem] cursor-pointer transition-all duration-[200ms] hover:border-charcoal hover:text-charcoal" onClick={() => setShowPasswordSection(true)}>Change Password</button>
              )}
            </div>
            {showPasswordSection && (
              <div className="flex flex-col gap-[1.5rem]">
                <div className="flex flex-col gap-[0.25rem]">
                  <label className="text-[0.8125rem] font-medium text-charcoal">Current Password</label>
                  <input type="password" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                </div>
                <div className="flex flex-col gap-[0.25rem]">
                  <label className="text-[0.8125rem] font-medium text-charcoal">New Password</label>
                  <input type="password" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  <p className="text-[0.75rem] text-muted mt-[2px]">Min 8 characters with uppercase, lowercase, number, and special character</p>
                </div>
                <div className="flex flex-col gap-[0.25rem]">
                  <label className="text-[0.8125rem] font-medium text-charcoal">Confirm New Password</label>
                  <input type="password" className="py-[0.625rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.875rem] text-charcoal outline-none transition-colors duration-[200ms] focus:border-charcoal placeholder:text-muted" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && <p className="text-[0.75rem] text-error mt-[2px]">Passwords do not match</p>}
                </div>
                <div className="flex gap-[0.5rem] justify-end mt-[1.5rem]">
                  <button type="button" className="py-[0.625rem] px-[1.25rem] bg-transparent text-slate border border-border rounded-[8px] font-body text-[0.8125rem] cursor-pointer transition-all duration-[200ms] hover:border-charcoal hover:text-charcoal" onClick={() => { setShowPasswordSection(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</button>
                  <button type="button" className="py-[0.625rem] px-[1.5rem] bg-charcoal text-white border-none rounded-[8px] font-body text-[0.8125rem] font-medium cursor-pointer transition-all duration-[200ms] hover:not-disabled:bg-charcoal-light hover:not-disabled:-translate-y-[1px] hover:not-disabled:shadow-soft disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleChangePassword} disabled={passwordSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Account */}
          <section className="bg-white border border-border-light rounded-[12px] p-[2rem] max-sm:p-[1.5rem]">
            <h3 className="font-body text-[1rem] font-semibold text-charcoal mb-[2px]">Account</h3>
            <p className="text-[0.8125rem] text-muted mb-[1.5rem]">Your account information</p>
            <div className="flex flex-col">
              <div className="flex items-center justify-between py-[1rem] max-sm:flex-col max-sm:items-start max-sm:gap-[0.25rem]">
                <span className="text-[0.8125rem] font-medium text-muted">Email</span>
                <span className="text-[0.875rem] text-charcoal font-medium">{user?.email ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between py-[1rem] border-t border-border-light max-sm:flex-col max-sm:items-start max-sm:gap-[0.25rem]">
                <span className="text-[0.8125rem] font-medium text-muted">Role</span>
                <span className={`inline-flex items-center py-[0.25rem] px-[0.625rem] rounded-full text-[0.6875rem] font-semibold uppercase tracking-[0.05em] ${getRoleBadgeClass(user?.role ?? 'BUYER')}`}>{user?.role ?? 'BUYER'}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-white border border-[rgba(200,80,80,0.15)] rounded-[12px] p-[2rem] max-sm:p-[1.5rem]">
            <h3 className="font-body text-[1rem] font-semibold text-charcoal mb-[2px]">Danger Zone</h3>
            <p className="text-[0.8125rem] text-muted mb-[1.5rem]">Irreversible actions</p>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-[1.5rem] py-[1rem] max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
                <div><p className="text-[0.875rem] font-medium text-charcoal">Log out of all devices</p><p className="text-[0.75rem] text-muted mt-[2px]">Revoke all active sessions</p></div>
                <button type="button" className="py-[0.5rem] px-[1rem] bg-transparent text-slate border border-border rounded-[8px] font-body text-[0.8125rem] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:border-charcoal hover:text-charcoal" onClick={handleLogout}>Log Out All</button>
              </div>
              <div className="flex items-center justify-between gap-[1.5rem] py-[1rem] border-t border-border-light max-sm:flex-col max-sm:items-start max-sm:gap-[0.5rem]">
                <div><p className="text-[0.875rem] font-medium text-charcoal">Delete account</p><p className="text-[0.75rem] text-muted mt-[2px]">Permanently remove your account and all data</p></div>
                <button type="button" className="py-[0.5rem] px-[1rem] bg-transparent text-error border border-[rgba(200,80,80,0.3)] rounded-[8px] font-body text-[0.8125rem] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:bg-[rgba(200,80,80,0.06)] hover:border-error hover:text-error" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
              </div>
            </div>
          </section>

          {/* Delete Confirm Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[4px] flex items-center justify-center z-100 animate-fade-in p-[2rem]" onClick={() => !deleteLoading && setShowDeleteConfirm(false)}>
              <div className="bg-white rounded-[16px] w-full max-w-[420px] p-[2rem] text-center animate-scale-in shadow-elevated" onClick={(e) => e.stopPropagation()}>
                <div className="text-error mb-[1rem]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className="font-display text-[1.25rem] font-normal text-charcoal mb-[0.5rem]">Delete your account?</h3>
                <p className="text-[0.875rem] text-slate leading-[1.5] mb-[2rem]">This action cannot be undone. All your data, orders, and messages will be permanently deleted.</p>
                <div className="flex gap-[0.5rem] justify-center max-sm:flex-col">
                  <button type="button" className="py-[0.625rem] px-[1.25rem] bg-transparent text-slate border border-border rounded-[8px] font-body text-[0.8125rem] cursor-pointer transition-all duration-[200ms] hover:border-charcoal hover:text-charcoal" onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>Cancel</button>
                  <button type="button" className="py-[0.5rem] px-[1rem] bg-transparent text-error border border-[rgba(200,80,80,0.3)] rounded-[8px] font-body text-[0.8125rem] cursor-pointer whitespace-nowrap transition-all duration-[200ms] hover:bg-[rgba(200,80,80,0.06)] hover:border-error hover:text-error" onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-charcoal text-white/60 mt-auto">
        <div className="max-w-[1280px] mx-auto py-[4rem] px-[2rem] max-sm:py-[3rem] max-sm:px-[1rem]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-[3rem] pb-[3rem] border-b border-white/[0.08] max-md:grid-cols-2 max-md:gap-[2rem] max-sm:grid-cols-1 max-sm:gap-[1.5rem]">
            <div className="flex flex-col gap-[1rem]">
              <div className="font-display text-[1.75rem] font-semibold text-gold tracking-[-0.03em]">Vibe</div>
              <p className="text-[0.875rem] leading-[1.6] max-w-[280px]">
                A curated marketplace where every product tells a story and every interaction feels personal.
              </p>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Shop</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">All Products</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">New Arrivals</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Best Sellers</Link></li>
                <li><Link href="/" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Sale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Support</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Help Center</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Shipping Info</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Returns</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-body text-[0.75rem] font-semibold text-white/90 uppercase tracking-[0.08em] mb-[1rem]">Company</h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-[0.5rem]">
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">About Us</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Careers</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Privacy Policy</a></li>
                <li><a href="#" className="text-[0.8125rem] text-white/50 no-underline transition-colors duration-[200ms] hover:text-gold">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between pt-[2rem] text-[0.75rem] max-sm:flex-col max-sm:gap-[0.5rem] max-sm:text-center">
            <span>&copy; 2026 Vibe. All rights reserved.</span>
            <div className="flex items-center gap-[0.5rem] text-[0.75rem] text-white/35">
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
