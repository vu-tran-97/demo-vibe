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

    if (error) {
      setStatus('error');
      setErrorMessage(message || 'Social login failed. Please try again.');
      return;
    }

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      let role = '';
      if (user) {
        localStorage.setItem('user', user);
        try { role = JSON.parse(user).role; } catch { /* ignore */ }
      }
      router.push(role === 'BUYER' ? '/' : '/dashboard');
      return;
    }

    setStatus('error');
    setErrorMessage('Invalid callback parameters. Please try again.');
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem',
        fontFamily: 'var(--font-body, system-ui)',
      }}>
        <h2 style={{ color: 'var(--charcoal, #1a1a1a)', fontSize: '1.5rem' }}>
          Login Failed
        </h2>
        <p style={{ color: 'var(--muted, #666)', textAlign: 'center' }}>
          {errorMessage}
        </p>
        <button
          onClick={() => router.push('/')}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--charcoal, #1a1a1a)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9375rem',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      fontFamily: 'var(--font-body, system-ui)',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border, #e5e5e5)',
        borderTopColor: 'var(--charcoal, #1a1a1a)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--muted, #666)' }}>
        Completing sign in...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <p>Loading...</p>
      </div>
    }>
      <SocialCallbackContent />
    </Suspense>
  );
}
