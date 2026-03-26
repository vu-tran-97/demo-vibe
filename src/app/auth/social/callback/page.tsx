'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SocialCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const user = searchParams.get('user');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) { setStatus('error'); setErrorMessage(message || 'Social login failed. Please try again.'); return; }

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      let role = '';
      if (user) { localStorage.setItem('user', user); try { role = JSON.parse(user).role; } catch { /* ignore */ } }
      router.push(role === 'BUYER' ? '/' : '/dashboard');
      return;
    }

    setStatus('error');
    setErrorMessage('Invalid callback parameters. Please try again.');
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-[1rem] p-[2rem] font-body">
        <h2 className="text-charcoal text-[1.5rem]">Login Failed</h2>
        <p className="text-muted text-center">{errorMessage}</p>
        <button onClick={() => router.push('/')} className="py-[0.75rem] px-[2rem] bg-charcoal text-white border-none rounded-[8px] cursor-pointer text-[0.9375rem]">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-[1rem] font-body">
      <div className="w-[40px] h-[40px] border-[3px] border-border border-t-charcoal rounded-full animate-spin" />
      <p className="text-muted">Completing sign in...</p>
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>}>
      <SocialCallbackContent />
    </Suspense>
  );
}
