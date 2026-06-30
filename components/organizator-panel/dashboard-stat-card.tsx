import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: 'default' | 'primary' | 'success';
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]',
        accent === 'primary' && 'border-primary/20',
        accent === 'success' && 'border-[var(--bf-success)]/20'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            accent === 'primary' && 'bg-primary/15 text-primary',
            accent === 'success' && 'bg-[var(--bf-success)]/10 text-[var(--bf-success)]',
            accent === 'default' && 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
