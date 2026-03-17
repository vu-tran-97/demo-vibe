'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createAdminUser } from '@/lib/admin';
import styles from './admin.module.css';

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminCreateUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminCreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'SELLER' | 'BUYER'>('BUYER');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setRole('BUYER');
      setError('');
      setFieldErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)
    ) {
      errors.password =
        'Must include uppercase, lowercase, number, and special character';
    }

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await createAdminUser({ email, password, name, role });
      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.createModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.createModalHeader}>
          <h2 id="create-user-title" className={styles.createModalTitle}>
            Create New User
          </h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
          >
            &#10005;
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form className={styles.createForm} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label htmlFor="create-email" className={styles.fieldLabel}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              id="create-email"
              type="email"
              className={`${styles.fieldInput} ${fieldErrors.email ? styles.fieldInputError : ''}`}
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          <div className={styles.formField}>
            <label htmlFor="create-password" className={styles.fieldLabel}>
              Password <span className={styles.required}>*</span>
            </label>
            <input
              id="create-password"
              type="password"
              className={`${styles.fieldInput} ${fieldErrors.password ? styles.fieldInputError : ''}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <div className={styles.formField}>
            <label htmlFor="create-name" className={styles.fieldLabel}>
              Name <span className={styles.required}>*</span>
            </label>
            <input
              id="create-name"
              type="text"
              className={`${styles.fieldInput} ${fieldErrors.name ? styles.fieldInputError : ''}`}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          <div className={styles.formField}>
            <label htmlFor="create-role" className={styles.fieldLabel}>
              Role <span className={styles.required}>*</span>
            </label>
            <select
              id="create-role"
              className={styles.fieldSelect}
              value={role}
              onChange={(e) => setRole(e.target.value as 'SELLER' | 'BUYER')}
            >
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>
          </div>

          <div className={styles.createFormActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
