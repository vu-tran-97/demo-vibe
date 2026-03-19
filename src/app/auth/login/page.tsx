"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, isLoggedIn, getUser, AuthError } from "@/lib/auth";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      const user = getUser();
      router.replace(user?.role === "BUYER" ? "/" : "/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      router.push(result.user.role === "BUYER" ? "/" : "/dashboard");
    } catch (err) {
      if (err instanceof AuthError) {
        switch (err.code) {
          case "INVALID_CREDENTIALS":
            setError("Invalid email or password.");
            break;
          case "ACCOUNT_SUSPENDED":
            setError("Your account has been suspended.");
            break;
          case "ACCOUNT_INACTIVE":
            setError("Your account is inactive.");
            break;
          case "VALIDATION_ERROR":
            setError(err.message);
            break;
          default:
            setError(err.message);
        }
      } else {
        setError("Unable to connect to server. Please try again.");
      }
      setLoading(false);
    }
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
            &ldquo;Shopping should feel like a conversation with a trusted
            friend.&rdquo;
          </p>
          <p className={styles.brandAttribution}>— The Vibe philosophy</p>
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
          {/* <div className={styles.socialButtons}>
            <button type="button" className={styles.socialBtn}>
              <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
              Continue with Google
            </button>
          </div> */}

          {/* Divider */}
          {/* <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div> */}

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Email Form */}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className={styles.formFooter}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
