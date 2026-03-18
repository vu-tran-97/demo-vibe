"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login, signup, AuthError } from "@/lib/auth";
import styles from "./auth-modal.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ModalView = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ModalView;
  onSuccess?: () => void;
  /** When true, skips navigation after login/signup (used for session re-auth) */
  stayOnPage?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
  onSuccess,
  stayOnPage = false,
}: AuthModalProps) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>(initialView);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupNickname, setSignupNickname] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const resetForm = useCallback(() => {
    setError("");
    setEmail("");
    setPassword("");
    setSignupName("");
    setSignupNickname("");
    setSignupEmail("");
    setSignupPassword("");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function switchView(newView: ModalView) {
    setView(newView);
    setError("");
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      onClose();
      if (onSuccess) onSuccess();
      if (!stayOnPage) {
        const role = result.user.role;
        router.push(role === "BUYER" ? "/" : "/dashboard");
      }
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
          default:
            setError(err.message);
        }
      } else {
        setError("Unable to connect to server. Please try again.");
      }
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signup(
        signupEmail,
        signupPassword,
        signupName,
        signupNickname || undefined,
      );
      onClose();
      if (onSuccess) onSuccess();
      if (!stayOnPage) {
        const role = result.user.role;
        router.push(role === "BUYER" ? "/" : "/dashboard");
      }
    } catch (err) {
      if (err instanceof AuthError) {
        switch (err.code) {
          case "EMAIL_ALREADY_EXISTS":
            setError("This email is already registered.");
            break;
          case "NICKNAME_ALREADY_EXISTS":
            setError("This nickname is already taken.");
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

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {view === "login" ? (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Welcome back</h2>
              <p className={styles.subtitle}>
                Sign in to continue your journey
              </p>
            </div>

            {/* Social Login */}
            {/* <div className={styles.socialButtons}>
              <a
                href={`${API_BASE}/api/auth/social/google`}
                className={styles.socialBtn}
              >
                <span className={`${styles.socialIcon} ${styles.google}`}>
                  G
                </span>
                Continue with Google
              </a>
            </div> */}

            {/* <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div> */}

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="login-email" className={styles.label}>
                  Email
                </label>
                <input
                  id="login-email"
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
                <label htmlFor="login-password" className={styles.label}>
                  Password
                </label>
                <input
                  id="login-password"
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
                <button type="button" className={styles.forgotLink}>
                  Forgot password?
                </button>
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
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => switchView("signup")}
              >
                Create one
              </button>
            </p>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h2 className={styles.title}>Create account</h2>
              <p className={styles.subtitle}>
                Start your journey in under a minute
              </p>
            </div>

            {/* Social Login */}
            {/* <div className={styles.socialButtons}>
              <a
                href={`${API_BASE}/api/auth/social/google`}
                className={styles.socialBtn}
              >
                <span className={`${styles.socialIcon} ${styles.google}`}>
                  G
                </span>
                Sign up with Google
              </a>
              <a
                href={`${API_BASE}/api/auth/social/kakao`}
                className={styles.socialBtn}
              >
                <span className={`${styles.socialIcon} ${styles.kakao}`}>
                  K
                </span>
                Sign up with Kakao
              </a>
              <a
                href={`${API_BASE}/api/auth/social/naver`}
                className={styles.socialBtn}
              >
                <span className={`${styles.socialIcon} ${styles.naver}`}>
                  N
                </span>
                Sign up with Naver
              </a>
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>} */}

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form className={styles.form} onSubmit={handleSignup}>
              <div>
                <div className={styles.inputGroup}>
                  <label htmlFor="signup-name" className={styles.label}>
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    className={styles.input}
                    placeholder="Your name"
                    autoComplete="name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="signup-nickname" className={styles.label}>
                  Nickname
                </label>
                <input
                  id="signup-nickname"
                  type="text"
                  className={styles.input}
                  placeholder="Display name"
                  value={signupNickname}
                  onChange={(e) => setSignupNickname(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="signup-email" className={styles.label}>
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="signup-password" className={styles.label}>
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className={styles.input}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className={styles.inputHint}>
                  Must include uppercase, lowercase, number, and special
                  character
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
              By signing up, you agree to our <a href="#">Terms of Service</a>{" "}
              and <a href="#">Privacy Policy</a>.
            </p>

            <p className={styles.formFooter}>
              Already have an account?{" "}
              <button
                type="button"
                className={styles.switchBtn}
                onClick={() => switchView("login")}
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
