import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-badge)] border px-2 py-0.5 text-[11px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline:
          'border-border bg-background text-foreground',
        destructive:
          'border-transparent bg-[var(--bf-danger-soft)] text-[var(--bf-danger)]',
        success:
          'border-transparent bg-[var(--bf-success-soft)] text-[var(--bf-success)]',
        warning:
          'border-transparent bg-[var(--bf-warning-soft)] text-[var(--bf-warning)]',
        info:
          'border-transparent bg-[var(--bf-info-soft)] text-[var(--bf-info)]',
        /* Event & commerce */
        featured:
          'border-transparent bg-primary text-primary-foreground',
        vip:
          'border-[var(--bf-neon-soft-border)] bg-[var(--bf-neon-light-surface)] text-[var(--bf-text)]',
        earlyBird:
          'border-transparent bg-[var(--bf-info-soft)] text-[var(--bf-info)]',
        soldOut:
          'border-transparent bg-[var(--bf-muted-surface)] text-[var(--bf-text-muted)]',
        lastTickets:
          'border-transparent bg-[var(--bf-warning-soft)] text-[var(--bf-warning)]',
        discount:
          'border-transparent bg-primary text-primary-foreground',
        cancelled:
          'border-transparent bg-[var(--bf-danger-soft)] text-[var(--bf-danger)]',
        free:
          'border-transparent bg-[var(--bf-success-soft)] text-[var(--bf-success)]',
        new:
          'border-transparent bg-[var(--bf-neon)] text-[var(--bf-neon-on)]',
        trending:
          'border-transparent bg-[var(--bf-neon-light-surface)] text-[var(--bf-text)]',
        live:
          'border-transparent bg-[var(--bf-danger-soft)] text-[var(--bf-danger)] animate-pulse',
        today:
          'border-[var(--bf-neon-soft-border)] bg-[var(--bf-neon-light-surface)] text-[var(--bf-text)]',
        tomorrow:
          'border-transparent bg-secondary text-secondary-foreground',
        verified:
          'border-[var(--bf-success-soft)] bg-[var(--bf-success-soft)] text-[var(--bf-success)]',
        official:
          'border-transparent bg-[var(--bf-text)] text-[var(--bf-text-inverse)]',
        sponsor:
          'border-transparent bg-[var(--bf-info-soft)] text-[var(--bf-info)]',
        promotion:
          'border-transparent bg-primary text-primary-foreground',
        ai:
          'border-[var(--bf-info-soft)] bg-[var(--bf-info-soft)] text-[var(--bf-info)]',
        category:
          'border border-border/60 bg-[var(--bf-secondary-bg)] text-[var(--bf-text-secondary)]',
        organizer:
          'border-transparent bg-secondary text-secondary-foreground'
      },
      size: {
        default: 'px-2 py-0.5 text-[11px]',
        sm: 'px-1.5 py-px text-[10px]',
        lg: 'px-2.5 py-1 text-xs'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
