'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './toast.module.css';

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
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.icon}>{ICONS[toast.type]}</span>
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => dismiss(toast.id)}
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  );
}
