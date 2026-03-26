'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ICONS: Record<ToastMessage['type'], string> = {
  success: '\u2713',
  error: '\u2717',
  info: '\u2139',
};

let toastIdCounter = 0;
const listeners: Set<(toast: ToastMessage) => void> = new Set();

/**
 * Show a toast notification from anywhere.
 * Call this function imperatively — no need for context/provider.
 */
export function showToast(message: string, type: ToastMessage['type'] = 'success') {
  const toast: ToastMessage = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
  };
  listeners.forEach((fn) => fn(toast));
}

/**
 * Toast container component. Mount once in your layout.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast]);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[3rem] right-[3rem] z-[9999] flex flex-col gap-[0.5rem] pointer-events-none max-sm:bottom-[1.5rem] max-sm:right-[1rem] max-sm:left-[1rem]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-[1rem] py-[1rem] px-[2rem] ${toast.type === 'error' ? 'bg-error' : 'bg-charcoal'} text-white rounded-[8px] font-body text-[0.875rem] font-medium shadow-elevated animate-toast-in pointer-events-auto max-w-[360px] max-sm:max-w-full`}
        >
          <span className="text-[1rem] shrink-0 opacity-80">{ICONS[toast.type]}</span>
          <span className="flex-1 leading-[1.4]">{toast.message}</span>
          <button
            type="button"
            className="bg-transparent border-none text-white/60 cursor-pointer p-[2px] text-[0.875rem] transition-colors duration-[200ms] shrink-0 hover:text-white"
            onClick={() => dismiss(toast.id)}
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  );
}
