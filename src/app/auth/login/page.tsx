import Link from 'next/link';
import styles from '../auth.module.css';

export default function LoginPage() {
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
            &ldquo;Shopping should feel like a conversation with a trusted
            friend.&rdquo;
          </p>
          <p className={styles.brandAttribution}>
            — The Vibe philosophy
          </p>
        </div>
        <p className={styles.brandFooter}>
          &copy; 2026 Vibe. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>
              Sign in to continue your journey
            </p>
          </div>

          {/* Social Login */}
          <div className={styles.socialButtons}>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
              Continue with Google
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.kakao}`}>K</span>
              Continue with Kakao
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.naver}`}>N</span>
              Continue with Naver
            </button>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Email Form */}
          <form className={styles.form}>
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
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                Remember me
              </label>
              <Link href="#" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Sign In
            </button>
          </form>

          <p className={styles.formFooter}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
