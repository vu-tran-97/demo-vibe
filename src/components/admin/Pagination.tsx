'use client';

import { useState } from 'react';
import styles from './admin.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

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
    <div className={styles.pagination}>
      <button
        type="button"
        className={styles.pageBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
        aria-label="First page"
      >
        &#171;
      </button>

      <button
        type="button"
        className={styles.pageBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        &#8249;
      </button>

      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>
            {p}
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className={styles.pageBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        &#8250;
      </button>

      <button
        type="button"
        className={styles.pageBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
        aria-label="Last page"
      >
        &#187;
      </button>

      <form onSubmit={handleJump} className={styles.pageJump}>
        <input
          type="number"
          min={1}
          max={totalPages}
          placeholder="Page"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          className={styles.pageJumpInput}
          aria-label="Jump to page"
        />
        <button type="submit" className={styles.pageJumpBtn}>Go</button>
      </form>

      <span className={styles.pageInfo}>
        Page {page.toLocaleString()} of {totalPages.toLocaleString()} ({total.toLocaleString()} total)
      </span>
    </div>
  );
}
