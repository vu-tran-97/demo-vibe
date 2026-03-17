'use client';

import styles from './admin.module.css';

interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTV: 'Active',
  SUSP: 'Suspended',
  INAC: 'Inactive',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const dotClass =
    status === 'ACTV'
      ? styles.dotGreen
      : status === 'SUSP'
        ? styles.dotRed
        : styles.dotGray;

  return (
    <span
      className={styles.statusBadge}
      aria-label={`Status: ${STATUS_LABELS[status] || status}`}
    >
      <span className={`${styles.statusDot} ${dotClass}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
