'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createAdminUser } from '@/lib/admin';

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldInputCls = "py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white outline-none transition-all duration-[200ms] placeholder:text-muted focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(26,26,26,0.04)]";
const fieldInputErrorCls = "!border-error focus:!border-error focus:!shadow-[0_0_0_3px_rgba(196,91,91,0.1)]";

export function AdminCreateUserModal({ isOpen, onClose, onSuccess }: AdminCreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'SELLER' | 'BUYER'>('BUYER');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) { setEmail(''); setPassword(''); setName(''); setRole('BUYER'); setError(''); setFieldErrors({}); setLoading(false); }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) errors.password = 'Must include uppercase, lowercase, number, and special character';
    if (!name.trim()) errors.name = 'Name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try { await createAdminUser({ email, password, name, role }); onSuccess(); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create user'); }
    finally { setLoading(false); }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[rgba(26,26,26,0.4)] flex items-center justify-center p-[2rem] animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[12px] shadow-medium max-w-[480px] w-full animate-scale-in max-sm:max-w-full max-sm:mx-[1.5rem]" role="dialog" aria-modal="true" aria-labelledby="create-user-title" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between py-[1.5rem] px-[2rem] border-b border-border-light">
          <h2 id="create-user-title" className="font-display text-[1.125rem] font-normal text-charcoal">Create New User</h2>
          <button type="button" className="w-8 h-8 flex items-center justify-center text-[0.875rem] text-muted bg-transparent border-none rounded-[4px] cursor-pointer transition-all duration-[200ms] hover:text-charcoal hover:bg-ivory" onClick={onClose}>&#10005;</button>
        </div>

        {error && <div className="py-[1rem] px-[1.5rem] mx-[2rem] bg-[rgba(196,91,91,0.06)] border border-[rgba(196,91,91,0.2)] rounded-[8px] text-error text-[0.8125rem] leading-[1.5]">{error}</div>}

        <form className="flex flex-col gap-[1.5rem] p-[2rem]" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[0.25rem]">
            <label htmlFor="create-email" className="text-[0.8125rem] font-medium text-charcoal">Email <span className="text-error">*</span></label>
            <input id="create-email" type="email" className={`${fieldInputCls} ${fieldErrors.email ? fieldInputErrorCls : ''}`} placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {fieldErrors.email && <span className="text-[0.75rem] text-error">{fieldErrors.email}</span>}
          </div>

          <div className="flex flex-col gap-[0.25rem]">
            <label htmlFor="create-password" className="text-[0.8125rem] font-medium text-charcoal">Password <span className="text-error">*</span></label>
            <input id="create-password" type="password" className={`${fieldInputCls} ${fieldErrors.password ? fieldInputErrorCls : ''}`} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            {fieldErrors.password && <span className="text-[0.75rem] text-error">{fieldErrors.password}</span>}
          </div>

          <div className="flex flex-col gap-[0.25rem]">
            <label htmlFor="create-name" className="text-[0.8125rem] font-medium text-charcoal">Name <span className="text-error">*</span></label>
            <input id="create-name" type="text" className={`${fieldInputCls} ${fieldErrors.name ? fieldInputErrorCls : ''}`} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            {fieldErrors.name && <span className="text-[0.75rem] text-error">{fieldErrors.name}</span>}
          </div>

          <div className="flex flex-col gap-[0.25rem]">
            <label htmlFor="create-role" className="text-[0.8125rem] font-medium text-charcoal">Role <span className="text-error">*</span></label>
            <select id="create-role" className="py-[0.5rem] px-[0.875rem] border border-border rounded-[8px] font-body text-[0.8125rem] text-charcoal bg-white cursor-pointer outline-none focus:border-charcoal" value={role} onChange={(e) => setRole(e.target.value as 'SELLER' | 'BUYER')}>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
            </select>
          </div>

          <div className="flex justify-end gap-[1rem] pt-[0.5rem]">
            <button type="button" className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-charcoal bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-ivory disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="py-[0.5rem] px-[1.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:bg-charcoal-light disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
