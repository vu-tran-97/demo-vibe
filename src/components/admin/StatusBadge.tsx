'use client';

interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTV: 'Active',
  SUSP: 'Suspended',
  INAC: 'Inactive',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const dotColor =
    status === 'ACTV'
      ? 'bg-success'
      : status === 'SUSP'
        ? 'bg-error'
        : 'bg-muted';

  return (
    <span
      className="inline-flex items-center gap-[0.5rem] text-[0.8125rem] text-charcoal"
      aria-label={`Status: ${STATUS_LABELS[status] || status}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
