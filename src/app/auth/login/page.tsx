"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, isLoggedIn, getUser, AuthError } from "@/lib/auth";

const inputCls = "py-[0.75rem] px-[1rem] border border-border rounded-[8px] font-body text-[0.9375rem] text-charcoal bg-white transition-all duration-[200ms] outline-none placeholder:text-muted placeholder:font-light focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]";
const submitCls = "py-[0.875rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] tracking-[0.01em] hover:bg-charcoal-light hover:-translate-y-px hover:shadow-soft disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const labelCls = "text-[0.8125rem] font-medium text-charcoal tracking-[0.01em]";

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

  return (
    <div className="min-h-screen grid grid-cols-[1fr_1fr] max-md:grid-cols-[1fr]">
      {/* Left Panel — Branding */}
      <div className="relative flex flex-col justify-between p-[4rem] bg-charcoal overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_20%_80%,rgba(200,169,110,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(200,169,110,0.06)_0%,transparent_50%)] before:pointer-events-none max-md:hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <div className="absolute top-0 bottom-0 left-[33.33%] w-px bg-white" />
          <div className="absolute top-0 bottom-0 left-[66.66%] w-px bg-white" />
        </div>
        <Link href="/" className="font-display text-[1.5rem] font-medium text-white tracking-[-0.03em] relative z-[1]">
          Vibe
        </Link>
        <div className="relative z-[1]">
          <p className="font-display text-[clamp(2rem,3vw,2.75rem)] font-light italic text-white leading-[1.3] mb-[2rem] max-w-[420px]">
            &ldquo;Shopping should feel like a conversation with a trusted friend.&rdquo;
          </p>
          <p className="text-[0.875rem] text-white/40 tracking-[0.02em]">— The Vibe philosophy</p>
        </div>
        <p className="relative z-[1] text-[0.8125rem] text-white/30">&copy; 2026 Vibe. All rights reserved.</p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex items-center justify-center p-[4rem] bg-ivory max-md:min-h-screen max-sm:p-[2rem]">
        <div className="w-full max-w-[400px] animate-scale-in">
          <div className="mb-[3rem]">
            <h1 className="text-[2rem] font-normal text-charcoal mb-[0.5rem]">Welcome back</h1>
            <p className="text-[0.9375rem] text-muted">Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="py-[0.75rem] px-[1rem] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#991b1b] text-[0.875rem] leading-[1.5] mb-[1.5rem]">{error}</div>
          )}

          <form className="flex flex-col gap-[1.5rem]" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-[0.25rem]">
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-[0.25rem]">
              <label htmlFor="password" className={labelCls}>Password</label>
              <input id="password" type="password" className={inputCls} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-[0.5rem] text-[0.8125rem] text-slate cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-charcoal cursor-pointer" />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-[0.8125rem] text-gold-dark bg-none border-none cursor-pointer transition-colors duration-[200ms] hover:text-gold">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className={submitCls} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[0.875rem] text-muted mt-[1rem] [&_a]:text-charcoal [&_a]:font-medium [&_a]:border-b [&_a]:border-border [&_a]:transition-colors [&_a]:duration-[200ms] hover:[&_a]:border-charcoal">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
