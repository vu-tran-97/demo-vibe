"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login, signup, loginWithGoogle, AuthError } from "@/lib/auth";

type ModalView = "login" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ModalView;
  onSuccess?: () => void;
  stayOnPage?: boolean;
}

const inputCls = "py-[0.7rem] px-[1rem] border border-border rounded-[8px] font-body text-[0.9375rem] text-charcoal bg-white transition-all duration-[200ms] outline-none placeholder:text-muted placeholder:font-light focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]";
const labelCls = "text-[0.8125rem] font-medium text-charcoal tracking-[0.01em]";
const submitCls = "py-[0.8rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] tracking-[0.01em] mt-[0.25rem] hover:bg-charcoal-light hover:-translate-y-px hover:shadow-soft disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const socialBtnCls = "flex items-center justify-center gap-[0.5rem] py-[0.7rem] border border-border rounded-[8px] bg-white font-body text-[0.875rem] font-medium text-charcoal cursor-pointer transition-all duration-[200ms] no-underline hover:border-charcoal hover:shadow-subtle hover:-translate-y-px";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupNickname, setSignupNickname] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<"BUYER" | "SELLER">("BUYER");

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
    setSignupRole("BUYER");
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
        router.push(result.user.role === "BUYER" ? "/" : "/dashboard");
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (firebaseErr.code === "auth/invalid-credential" || firebaseErr.code === "auth/wrong-password" || firebaseErr.code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (firebaseErr.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      onClose();
      if (onSuccess) onSuccess();
      if (!stayOnPage) {
        router.push(result.user.role === "BUYER" ? "/" : "/dashboard");
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signup(signupEmail, signupPassword, signupName, signupNickname || undefined, signupRole);
      onClose();
      if (onSuccess) onSuccess();
      if (!stayOnPage) {
        router.push(result.user.role === "SELLER" ? "/dashboard" : "/");
      }
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (err instanceof AuthError) {
        switch (err.code) {
          case "NICKNAME_ALREADY_EXISTS":
            setError("This nickname is already taken.");
            break;
          default:
            setError(err.message);
        }
      } else if (firebaseErr.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (firebaseErr.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(26,26,26,0.4)] backdrop-blur-[8px] flex items-center justify-center p-[2rem] animate-fade-in">
      <div className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-ivory rounded-[16px] shadow-elevated pt-[3rem] px-[3rem] pb-[2rem] animate-scale-in max-sm:p-[2rem] max-sm:max-w-full" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="absolute top-[1.5rem] right-[1.5rem] w-8 h-8 flex items-center justify-center text-[1.125rem] text-muted bg-transparent border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:bg-[rgba(0,0,0,0.04)]" onClick={onClose}>
          ✕
        </button>

        {view === "login" ? (
          <>
            <div className="mb-[2rem] text-center">
              <h2 className="font-display text-[1.75rem] font-normal text-charcoal mb-[0.25rem]">Welcome back</h2>
              <p className="text-[0.9375rem] text-muted">Sign in to continue your journey</p>
            </div>

            {/* Google Sign-In */}
            <div className="flex flex-col gap-[0.5rem] mb-[1.5rem]">
              <button type="button" className={socialBtnCls} onClick={handleGoogleLogin} disabled={loading}>
                <span className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[0.75rem] font-bold shrink-0 bg-[#f3f3f3] text-[#4285f4]">G</span>
                Continue with Google
              </button>
            </div>

            <div className="flex items-center gap-[1rem] mb-[1.5rem]">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[0.75rem] text-muted tracking-[0.1em] uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {error && <div className="py-[0.7rem] px-[1rem] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#991b1b] text-[0.875rem] leading-[1.5]">{error}</div>}

            <form className="flex flex-col gap-[1rem]" onSubmit={handleLogin}>
              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="login-email" className={labelCls}>Email</label>
                <input id="login-email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="login-password" className={labelCls}>Password</label>
                <input id="login-password" type="password" className={inputCls} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-[0.5rem] text-[0.8125rem] text-slate cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-charcoal cursor-pointer" />
                  Remember me
                </label>
                <button type="button" className="text-[0.8125rem] text-gold-dark bg-none border-none cursor-pointer transition-colors duration-[200ms] hover:text-gold">
                  Forgot password?
                </button>
              </div>

              <button type="submit" className={submitCls} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-[0.875rem] text-muted mt-[1rem]">
              Don&apos;t have an account?{" "}
              <button type="button" className="text-charcoal font-medium bg-none border-none border-b border-b-border cursor-pointer text-[0.875rem] font-body transition-colors duration-[200ms] hover:border-b-charcoal" onClick={() => switchView("signup")}>
                Create one
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="mb-[2rem] text-center">
              <h2 className="font-display text-[1.75rem] font-normal text-charcoal mb-[0.25rem]">Create account</h2>
              <p className="text-[0.9375rem] text-muted">Start your journey in under a minute</p>
            </div>

            {/* Google Sign-Up */}
            <div className="flex flex-col gap-[0.5rem] mb-[1.5rem]">
              <button type="button" className={socialBtnCls} onClick={handleGoogleLogin} disabled={loading}>
                <span className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[0.75rem] font-bold shrink-0 bg-[#f3f3f3] text-[#4285f4]">G</span>
                Sign up with Google
              </button>
            </div>

            <div className="flex items-center gap-[1rem] mb-[1.5rem]">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[0.75rem] text-muted tracking-[0.1em] uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {error && <div className="py-[0.7rem] px-[1rem] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#991b1b] text-[0.875rem] leading-[1.5]">{error}</div>}

            <form className="flex flex-col gap-[1rem]" onSubmit={handleSignup}>
              <div>
                <div className="flex flex-col gap-[0.25rem]">
                  <label htmlFor="signup-name" className={labelCls}>Full Name</label>
                  <input id="signup-name" type="text" className={inputCls} placeholder="Your name" autoComplete="name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="signup-nickname" className={labelCls}>Nickname</label>
                <input id="signup-nickname" type="text" className={inputCls} placeholder="Display name" value={signupNickname} onChange={(e) => setSignupNickname(e.target.value)} />
              </div>

              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="signup-email" className={labelCls}>Email</label>
                <input id="signup-email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="signup-password" className={labelCls}>Password</label>
                <input id="signup-password" type="password" className={inputCls} placeholder="Min. 8 characters" autoComplete="new-password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={8} />
                <p className="text-[0.75rem] text-muted mt-[2px]">
                  Must include uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Role Selector */}
              <div className="flex gap-[20px] mb-[4px]">
                <label className="flex items-center gap-[6px] cursor-pointer text-[0.875rem] font-medium text-charcoal">
                  <input type="radio" name="role" value="BUYER" checked={signupRole === "BUYER"} onChange={() => setSignupRole("BUYER")} />
                  Buyer
                </label>
                <label className="flex items-center gap-[6px] cursor-pointer text-[0.875rem] font-medium text-charcoal">
                  <input type="radio" name="role" value="SELLER" checked={signupRole === "SELLER"} onChange={() => setSignupRole("SELLER")} />
                  Seller
                </label>
              </div>

              <button type="submit" className={submitCls} disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="text-[0.75rem] text-muted text-center leading-[1.6] mt-[0.25rem] [&_a]:text-slate [&_a]:underline [&_a]:underline-offset-2">
              By signing up, you agree to our <a href="#">Terms of Service</a>{" "}
              and <a href="#">Privacy Policy</a>.
            </p>

            <p className="text-center text-[0.875rem] text-muted mt-[1rem]">
              Already have an account?{" "}
              <button type="button" className="text-charcoal font-medium bg-none border-none border-b border-b-border cursor-pointer text-[0.875rem] font-body transition-colors duration-[200ms] hover:border-b-charcoal" onClick={() => switchView("login")}>
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
