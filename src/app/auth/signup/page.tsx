import Link from 'next/link';
import styles from '../auth.module.css';

export default function SignupPage() {
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
            &ldquo;Join a community where every interaction is meaningful and
            every product tells a story.&rdquo;
          </p>
          <p className={styles.brandAttribution}>
            — 12,000+ happy members
          </p>
        </div>
        <p className={styles.brandFooter}>
          &copy; 2026 Vibe. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Signup Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create account</h1>
            <p className={styles.formSubtitle}>
              Start your journey in under a minute
            </p>
          </div>

          {/* Social Login */}
          <div className={styles.socialButtons}>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
              Sign up with Google
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.kakao}`}>K</span>
              Sign up with Kakao
            </button>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.naver}`}>N</span>
              Sign up with Naver
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
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={styles.input}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="nickname" className={styles.label}>
                  Nickname
                </label>
                <input
                  id="nickname"
                  type="text"
                  className={styles.input}
                  placeholder="Display name"
                />
              </div>
            </div>

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
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Create Account
            </button>
          </form>

          <p className={styles.terms}>
            By signing up, you agree to our{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>

          <p className={styles.formFooter}>
            Already have an account?{' '}
            <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
