'use client';

import { useEffect, useRef } from 'react';
import styles from './admin.module.css';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel,
  variant = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      confirmRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={styles.confirmModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className={styles.confirmTitle}>
          {title}
        </h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`${styles.confirmBtn} ${variant === 'danger' ? styles.confirmDanger : styles.confirmWarning}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
