'use client';

import styles from './admin.module.css';

interface RoleBadgeProps {
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Admin',
  SELLER: 'Seller',
  BUYER: 'Buyer',
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const variant =
    role === 'SUPER_ADMIN'
      ? styles.rolePurple
      : role === 'SELLER'
        ? styles.roleBlue
        : styles.roleGreen;

  return (
    <span
      className={`${styles.roleBadge} ${variant}`}
      aria-label={`Role: ${ROLE_LABELS[role] || role}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
