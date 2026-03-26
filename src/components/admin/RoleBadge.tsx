'use client';

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
      ? 'bg-charcoal text-white'
      : role === 'SELLER'
        ? 'bg-[rgba(200,169,110,0.12)] text-gold-dark'
        : 'bg-[rgba(90,138,106,0.08)] text-success';

  return (
    <span
      className={`inline-block py-[2px] px-[10px] text-[0.75rem] font-medium rounded-full ${variant}`}
      aria-label={`Role: ${ROLE_LABELS[role] || role}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}
