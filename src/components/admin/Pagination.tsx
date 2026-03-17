'use client';

import styles from './admin.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
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

  return (
    <div className={styles.pagination}>
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

      <span className={styles.pageInfo}>
        Page {page} of {totalPages} ({total} total)
      </span>
    </div>
  );
}
