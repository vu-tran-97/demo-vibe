'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import styles from './settings.module.css';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth(true);

  const [name, setName] = useState(user?.name ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [email] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'order_updates', label: 'Order Updates', description: 'Get notified when your order status changes', enabled: true },
    { id: 'new_messages', label: 'New Messages', description: 'Receive alerts for new chat messages', enabled: true },
    { id: 'promotions', label: 'Promotions & Offers', description: 'Special deals and discount notifications', enabled: false },
    { id: 'community', label: 'Community Activity', description: 'Replies to your posts and mentions', enabled: true },
    { id: 'newsletter', label: 'Weekly Newsletter', description: 'Curated picks and artisan stories', enabled: false },
  ]);

  function toggleNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  }

  function handleSaveProfile() {
    if (!name.trim()) return;
    setSavedMessage('Profile updated successfully');
    setTimeout(() => setSavedMessage(''), 3000);
  }

  function handleChangePassword() {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordSection(false);
    setSavedMessage('Password changed successfully');
    setTimeout(() => setSavedMessage(''), 3000);
  }

  return (
    <div className={styles.settings}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Settings</h2>
        <p className={styles.pageSubtitle}>Manage your account and preferences</p>
      </div>

      {/* Toast */}
      {savedMessage && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {savedMessage}
        </div>
      )}

      {/* Profile Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Profile</h3>
        <p className={styles.sectionDesc}>Your personal information</p>

        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {(user?.name ?? 'U').charAt(0)}
          </div>
          <div className={styles.avatarInfo}>
            <p className={styles.avatarName}>{user?.name ?? 'User'}</p>
            <p className={styles.avatarRole}>{user?.role ?? 'BUYER'}</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nickname</label>
            <input
              type="text"
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={`${styles.input} ${styles.inputDisabled}`}
              value={email}
              disabled
            />
            <p className={styles.inputHint}>Contact support to change your email</p>
          </div>
        </div>

        <div className={styles.sectionActions}>
          <button type="button" className={styles.primaryBtn} onClick={handleSaveProfile}>
            Save Changes
          </button>
        </div>
      </section>

      {/* Password Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Password</h3>
            <p className={styles.sectionDesc}>Change your account password</p>
          </div>
          {!showPasswordSection && (
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => setShowPasswordSection(true)}
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordSection && (
          <div className={styles.passwordForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className={styles.inputError}>Passwords do not match</p>
              )}
            </div>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notifications Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        <p className={styles.sectionDesc}>Choose what you want to be notified about</p>

        <div className={styles.notificationList}>
          {notifications.map((notif) => (
            <div key={notif.id} className={styles.notificationItem}>
              <div className={styles.notificationInfo}>
                <span className={styles.notificationLabel}>{notif.label}</span>
                <span className={styles.notificationDesc}>{notif.description}</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${notif.enabled ? styles.toggleOn : ''}`}
                onClick={() => toggleNotification(notif.id)}
                aria-label={`Toggle ${notif.label}`}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className={`${styles.section} ${styles.dangerSection}`}>
        <h3 className={styles.sectionTitle}>Danger Zone</h3>
        <p className={styles.sectionDesc}>Irreversible actions</p>

        <div className={styles.dangerActions}>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerLabel}>Log out of all devices</p>
              <p className={styles.dangerDesc}>Revoke all active sessions</p>
            </div>
            <button type="button" className={styles.dangerBtn} onClick={logout}>
              Log Out All
            </button>
          </div>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerLabel}>Delete account</p>
              <p className={styles.dangerDesc}>Permanently remove your account and all data</p>
            </div>
            <button
              type="button"
              className={`${styles.dangerBtn} ${styles.dangerBtnRed}`}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Delete your account?</h3>
            <p className={styles.modalDesc}>
              This action cannot be undone. All your data, orders, and messages will be permanently deleted.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button type="button" className={`${styles.dangerBtn} ${styles.dangerBtnRed}`}>
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
