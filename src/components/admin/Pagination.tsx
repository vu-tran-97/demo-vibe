'use client';

import { useState } from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const pageBtnCls = "min-w-[36px] h-[36px] flex items-center justify-center font-body text-[0.8125rem] text-slate bg-transparent border border-border rounded-[8px] cursor-pointer transition-all duration-[200ms] hover:not-disabled:border-charcoal hover:not-disabled:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed";

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  function handleJump(e: React.FormEvent) {
    e.preventDefault();
    const target = parseInt(jumpValue, 10);
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
    setJumpValue('');
  }

  return (
    <div className="flex items-center justify-center gap-[0.5rem] flex-wrap">
      <button type="button" className={pageBtnCls} disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="First page">&#171;</button>
      <button type="button" className={pageBtnCls} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">&#8249;</button>

      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className="min-w-[36px] flex items-center justify-center text-muted text-[0.8125rem]">{p}</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${pageBtnCls} ${p === page ? '!bg-charcoal !border-charcoal !text-white !font-medium hover:!bg-charcoal-light' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button type="button" className={pageBtnCls} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">&#8250;</button>
      <button type="button" className={pageBtnCls} disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">&#187;</button>

      <form onSubmit={handleJump} className="flex items-center gap-[4px] ml-[0.5rem]">
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder="Page"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          className="w-[72px] h-[36px] px-[0.25rem] font-body text-[0.8125rem] text-charcoal border border-border rounded-[8px] text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-charcoal"
          aria-label="Jump to page"
        />
        <button type="submit" className="h-[36px] px-[0.5rem] font-body text-[0.8125rem] font-medium text-white bg-charcoal border-none rounded-[8px] cursor-pointer transition-colors duration-[200ms] hover:bg-charcoal-light">Go</button>
      </form>

      <span className="text-[0.75rem] text-muted ml-[1rem] max-sm:w-full max-sm:text-center max-sm:ml-0 max-sm:mt-[0.5rem]">
        Page {page.toLocaleString()} of {totalPages.toLocaleString()} ({total.toLocaleString()} total)
      </span>
    </div>
  );
}
