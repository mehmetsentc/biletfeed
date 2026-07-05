import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:shadow-[var(--shadow-focus)] aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'btn-gradient-primary rounded-[var(--radius-button)] text-primary-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98] hover:-translate-y-px',
        destructive:
          'rounded-[var(--radius-button)] bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'rounded-[var(--radius-button)] border border-border bg-background shadow-[var(--shadow-xs)] hover:border-[var(--bf-orange-border)] hover:bg-[var(--bf-orange-surface)] hover:text-foreground active:scale-[0.98]',
        secondary:
          'rounded-[var(--radius-button)] bg-secondary text-secondary-foreground shadow-[var(--shadow-xs)] hover:bg-[var(--bf-muted-surface)] active:scale-[0.98]',
        ghost:
          'rounded-[var(--radius-button)] text-foreground hover:bg-[var(--bf-orange-surface)] hover:text-[var(--bf-orange-700)] active:scale-[0.98]',
        link:
          'text-[var(--bf-text-link)] underline-offset-4 hover:text-[var(--bf-text-link-hover)] hover:underline font-semibold p-0 h-auto',
        text:
          'rounded-[var(--radius-button)] text-[var(--bf-text-secondary)] hover:text-[var(--bf-text)] hover:bg-[var(--bf-secondary-bg)] active:scale-[0.98]',
        success:
          'rounded-[var(--radius-button)] bg-[var(--bf-success)] text-[var(--bf-text-inverse)] shadow-[var(--shadow-sm)] hover:opacity-90 active:scale-[0.98]',
        warning:
          'rounded-[var(--radius-button)] bg-[var(--bf-warning)] text-[var(--bf-text-inverse)] shadow-[var(--shadow-sm)] hover:opacity-90 active:scale-[0.98]'
      },
      size: {
        default: 'h-11 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 gap-1.5 px-3.5 text-sm has-[>svg]:px-3',
        lg: 'h-12 px-7 text-base has-[>svg]:px-5',
        icon: 'size-11 rounded-[var(--radius-button)]',
        fab: 'size-14 rounded-full shadow-[var(--shadow-md)]'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
