'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { forgotPassword, AuthError } from '@/lib/auth';

const inputCls = "py-[0.75rem] px-[1rem] border border-border rounded-[8px] font-body text-[0.9375rem] text-charcoal bg-white transition-all duration-[200ms] outline-none placeholder:text-muted placeholder:font-light focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]";
const submitCls = "py-[0.875rem] font-body text-[0.9375rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] tracking-[0.01em] hover:bg-charcoal-light hover:-translate-y-px hover:shadow-soft disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await forgotPassword(email); setSent(true); }
    catch (err) {
      if (err instanceof AuthError) setError(err.message);
      else setError('Unable to connect to server. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid grid-cols-[1fr_1fr] max-md:grid-cols-[1fr]">
      <div className="relative flex flex-col justify-between p-[4rem] bg-charcoal overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_20%_80%,rgba(200,169,110,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(200,169,110,0.06)_0%,transparent_50%)] before:pointer-events-none max-md:hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <div className="absolute top-0 bottom-0 left-[33.33%] w-px bg-white" />
          <div className="absolute top-0 bottom-0 left-[66.66%] w-px bg-white" />
        </div>
        <Link href="/" className="font-display text-[1.5rem] font-medium text-white tracking-[-0.03em] relative z-[1]">Vibe</Link>
        <div className="relative z-[1]">
          <p className="font-display text-[clamp(2rem,3vw,2.75rem)] font-light italic text-white leading-[1.3] mb-[2rem] max-w-[420px]">&ldquo;Every setback is a setup for a comeback.&rdquo;</p>
          <p className="text-[0.875rem] text-white/40 tracking-[0.02em]">— The Vibe philosophy</p>
        </div>
        <p className="relative z-[1] text-[0.8125rem] text-white/30">&copy; 2026 Vibe. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-[4rem] bg-ivory max-md:min-h-screen max-sm:p-[2rem]">
        <div className="w-full max-w-[400px] animate-scale-in">
          {sent ? (
            <>
              <div className="mb-[3rem]">
                <h1 className="text-[2rem] font-normal text-charcoal mb-[0.5rem]">Check your email</h1>
                <p className="text-[0.9375rem] text-muted">If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox and spam folder.</p>
              </div>
              <Link href="/auth/login" className={`${submitCls} block text-center`}>Back to Sign In</Link>
            </>
          ) : (
            <>
              <div className="mb-[3rem]">
                <h1 className="text-[2rem] font-normal text-charcoal mb-[0.5rem]">Forgot password?</h1>
                <p className="text-[0.9375rem] text-muted">Enter your email and we&apos;ll send you a reset link</p>
              </div>
              {error && <div className="py-[0.75rem] px-[1rem] bg-[#fef2f2] border border-[#fecaca] rounded-[8px] text-[#991b1b] text-[0.875rem] leading-[1.5] mb-[1.5rem]">{error}</div>}
              <form className="flex flex-col gap-[1.5rem]" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-[0.25rem]">
                  <label htmlFor="email" className="text-[0.8125rem] font-medium text-charcoal tracking-[0.01em]">Email</label>
                  <input id="email" type="email" className={inputCls} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className={submitCls} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
              </form>
              <p className="text-center text-[0.875rem] text-muted mt-[1rem] [&_a]:text-charcoal [&_a]:font-medium [&_a]:border-b [&_a]:border-border [&_a]:transition-colors [&_a]:duration-[200ms] hover:[&_a]:border-charcoal">
                Remember your password?{' '}<Link href="/auth/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
