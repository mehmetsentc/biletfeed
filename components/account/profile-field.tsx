import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfileField({
  label,
  required,
  icon: Icon,
  children,
  className,
  multiline
}: {
  label: string;
  required?: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-sm text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <div className={cn('relative', multiline && 'flex gap-3')}>
        <Icon
          className={cn(
            'pointer-events-none absolute text-muted-foreground',
            multiline
              ? 'left-3.5 top-4 size-4'
              : 'left-3.5 top-1/2 size-4 -translate-y-1/2'
          )}
          strokeWidth={1.75}
        />
        {children}
      </div>
    </div>
  );
}

export const profileInputClass =
  'h-12 w-full rounded-xl border-0 bg-muted/70 pl-11 pr-4 text-sm text-foreground shadow-none ring-1 ring-border/60 placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/40';

export const profileSelectClass =
  'h-12 w-full appearance-none rounded-xl border-0 bg-muted/70 pl-11 pr-10 text-sm text-foreground shadow-none ring-1 ring-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/40';
