'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { forgotPassword, AuthError } from '@/lib/auth';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    }
    setLoading(false);
  }

  return (
    <div className={styles.page}>
      {/* Left Panel — Branding */}
      <div className={styles.brandPanel}>
        <div className={styles.gridLines} />
        <Link href="/" className={styles.brandLogo}>
          Vibe
        </Link>
        <div className={styles.brandContent}>
          <p className={styles.brandQuote}>
            &ldquo;Every setback is a setup for a comeback.&rdquo;
          </p>
          <p className={styles.brandAttribution}>
            — The Vibe philosophy
          </p>
        </div>
        <p className={styles.brandFooter}>
          &copy; 2026 Vibe. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          {sent ? (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Check your email</h1>
                <p className={styles.formSubtitle}>
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a
                  password reset link. Check your inbox and spam folder.
                </p>
              </div>
              <Link href="/auth/login" className={styles.submitBtn} style={{ display: 'block', textAlign: 'center' }}>
                Back to Sign In
              </Link>
            </>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Forgot password?</h1>
                <p className={styles.formSubtitle}>
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className={styles.formFooter}>
                Remember your password?{' '}
                <Link href="/auth/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
