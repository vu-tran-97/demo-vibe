'use client';

import { useEffect, useRef } from 'react';

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
    return () => { document.body.style.overflow = ''; };
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
    <div className="fixed inset-0 z-[100] bg-[rgba(26,26,26,0.4)] flex items-center justify-center p-[2rem] animate-fade-in" onClick={onCancel}>
      <div
        className="bg-white rounded-[12px] shadow-medium p-[2rem] max-w-[420px] w-full animate-scale-in max-sm:max-w-full max-sm:mx-[1.5rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="font-display text-[1.125rem] font-normal text-charcoal mb-[0.5rem]">
          {title}
        </h3>
        <p className="text-[0.8125rem] text-slate leading-[1.6] mb-[2rem]">{message}</p>
        <div className="flex justify-end gap-[1rem] mt-[2rem]">
          <button
            type="button"
            className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'danger'
                ? 'bg-error hover:not-disabled:bg-[#b04a4a]'
                : 'bg-gold-dark hover:not-disabled:bg-gold'
            }`}
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
