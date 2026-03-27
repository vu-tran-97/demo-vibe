"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, isLoggedIn, getUser, AuthError, validateSignupFields } from "@/lib/auth";

const inputCls = "py-[0.75rem] px-[1rem] border border-border rounded-[8px] font-body text-[0.9375rem] text-charcoal bg-white transition-all duration-[200ms] outline-none placeholder:text-muted placeholder:font-light focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]";
const submitCls = "py-[0.875rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] tracking-[0.01em] hover:bg-charcoal-light hover:-translate-y-px hover:shadow-soft disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
const labelCls = "text-[0.8125rem] font-medium text-charcoal tracking-[0.01em]";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
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

    const validationError = validateSignupFields(name, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email, password, name, nickname || undefined, role);
      router.push(result.user.role === "SELLER" ? "/dashboard" : "/");
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (err instanceof AuthError) {
        setError(err.message);
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

  return (
    <div className="min-h-screen grid grid-cols-[1fr_1fr] max-md:grid-cols-[1fr]">
      {/* Left Panel — Branding */}
      <div className="relative flex flex-col justify-between p-[4rem] bg-charcoal overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_20%_80%,rgba(200,169,110,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(200,169,110,0.06)_0%,transparent_50%)] before:pointer-events-none max-md:hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <div className="absolute top-0 bottom-0 left-[33.33%] w-px bg-white" />
          <div className="absolute top-0 bottom-0 left-[66.66%] w-px bg-white" />
        </div>
        <Link href="/" className="font-display text-[1.5rem] font-medium text-white tracking-[-0.03em] relative z-[1]">Vibe</Link>
        <div className="relative z-[1]">
          <p className="font-display text-[clamp(2rem,3vw,2.75rem)] font-light italic text-white leading-[1.3] mb-[2rem] max-w-[420px]">
            &ldquo;Join a community where every interaction is meaningful and every product tells a story.&rdquo;
          </p>
          <p className="text-[0.875rem] text-white/40 tracking-[0.02em]">— 12,000+ happy members</p>
        </div>
        <p className="relative z-[1] text-[0.8125rem] text-white/30">&copy; 2026 Vibe. All rights reserved.</p>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex items-center justify-center p-[4rem] bg-ivory max-md:min-h-screen max-sm:p-[2rem]">
        <div className="w-full max-w-[400px] animate-scale-in">
          <div className="mb-[3rem]">
            <h1 className="text-[2rem] font-normal text-charcoal mb-[0.5rem]">Create account</h1>
            <p className="text-[0.9375rem] text-muted">Start your journey in under a minute</p>
          </div>

          <div className="flex items-center gap-[1rem] mb-[2rem]">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[0.75rem] text-muted tracking-[0.1em] uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {error && <div className="py-[0.75rem] px-[1rem] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#991b1b] text-[0.875rem] leading-[1.5] mb-[1.5rem]">{error}</div>}

          <form className="flex flex-col gap-[1.5rem]" onSubmit={handleSubmit}>
            <div className="grid grid-cols-[1fr_1fr] gap-[1rem] max-sm:grid-cols-[1fr]">
              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="name" className={labelCls}>Full Name</label>
                <input id="name" type="text" className={inputCls} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-[0.25rem]">
                <label htmlFor="nickname" className={labelCls}>Nickname</label>
                <input id="nickname" type="text" className={inputCls} placeholder="Display name" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-[0.25rem]">
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-[0.25rem]">
              <label htmlFor="password" className={labelCls}>Password</label>
              <input id="password" type="password" className={inputCls} placeholder="Min. 8 characters" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <p className="text-[0.75rem] text-muted mt-[2px]">Must include uppercase, lowercase, number, and special character</p>
            </div>

            <div className="flex gap-[20px] mb-[4px]">
              <label className="flex items-center gap-[6px] cursor-pointer text-[0.9375rem] font-medium text-charcoal">
                <input type="radio" name="signup-role" value="BUYER" checked={role === "BUYER"} onChange={() => setRole("BUYER")} />
                Buyer
              </label>
              <label className="flex items-center gap-[6px] cursor-pointer text-[0.9375rem] font-medium text-charcoal">
                <input type="radio" name="signup-role" value="SELLER" checked={role === "SELLER"} onChange={() => setRole("SELLER")} />
                Seller
              </label>
            </div>

            <button type="submit" className={submitCls} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-[0.75rem] text-muted text-center leading-[1.6] mt-[0.5rem] [&_a]:text-slate [&_a]:underline [&_a]:underline-offset-2">
            By signing up, you agree to our <a href="#">Terms of Service</a> and{" "}<a href="#">Privacy Policy</a>.
          </p>

          <p className="text-center text-[0.875rem] text-muted mt-[1rem] [&_a]:text-charcoal [&_a]:font-medium [&_a]:border-b [&_a]:border-border [&_a]:transition-colors [&_a]:duration-[200ms] hover:[&_a]:border-charcoal">
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
