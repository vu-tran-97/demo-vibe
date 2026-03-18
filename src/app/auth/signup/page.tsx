"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, isLoggedIn, getUser, AuthError } from "@/lib/auth";
import styles from "../auth.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
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
      const result = await signup(email, password, name, nickname || undefined);
      router.push(result.user.role === "BUYER" ? "/" : "/dashboard");
    } catch (err) {
      if (err instanceof AuthError) {
        switch (err.code) {
          case "EMAIL_ALREADY_EXISTS":
            setError("This email is already registered.");
            break;
          case "NICKNAME_ALREADY_EXISTS":
            setError("This nickname is already taken.");
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
            &ldquo;Join a community where every interaction is meaningful and
            every product tells a story.&rdquo;
          </p>
          <p className={styles.brandAttribution}>— 12,000+ happy members</p>
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
          {/* <div className={styles.socialButtons}>
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
          </div> */}

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Email Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
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
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className={styles.inputHint}>
                Must include uppercase, lowercase, number, and special character
              </p>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className={styles.terms}>
            By signing up, you agree to our <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>

          <p className={styles.formFooter}>
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
