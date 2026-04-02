import { cn } from '@/lib/utils';

type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'draft';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  dot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusVariant, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border-success/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-border',
  },
  pending: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  success: {
    label: 'Success',
    className: 'bg-success/10 text-success border-success/20',
  },
  warning: {
    label: 'Warning',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  error: {
    label: 'Error',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  info: {
    label: 'Info',
    className: 'bg-info/10 text-info border-info/20',
  },
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function StatusBadge({ status, label, dot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusVariant];
  const displayLabel = label ?? config?.label ?? status;
  const badgeClass = config?.className ?? 'bg-muted text-muted-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full bg-current')}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
