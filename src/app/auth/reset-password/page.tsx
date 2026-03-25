'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from '../auth.module.css';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!oobCode) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or expired. Please request a new one.');
      } else if (firebaseErr.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError('Unable to reset password. Please try again.');
      }
    }
    setLoading(false);
  }

  return (
    <div className={styles.formContainer}>
      {success ? (
        <>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Password reset!</h1>
            <p className={styles.formSubtitle}>
              Your password has been successfully updated. You can now sign in
              with your new password.
            </p>
          </div>
          <Link href="/auth/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center' }}>
            Sign In
          </Link>
        </>
      ) : (
        <>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Reset password</h1>
            <p className={styles.formSubtitle}>
              Enter your new password below
            </p>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                New Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <p className={styles.formFooter}>
            <Link href="/auth/login">Back to Sign In</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div className={styles.gridLines} />
        <Link href="/" className={styles.brandLogo}>
          Vibe
        </Link>
        <div className={styles.brandContent}>
          <p className={styles.brandQuote}>
            &ldquo;A fresh start, beautifully simple.&rdquo;
          </p>
          <p className={styles.brandAttribution}>
            — The Vibe philosophy
          </p>
        </div>
        <p className={styles.brandFooter}>
          &copy; 2026 Vibe. All rights reserved.
        </p>
      </div>

      <div className={styles.formPanel}>
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
