import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:shadow-[var(--shadow-focus)] aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default:
          'rounded-[var(--radius-button)] bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-[var(--bf-orange-hover)] active:bg-[var(--bf-orange-pressed)] hover:shadow-[var(--shadow-md)]',
        destructive:
          'rounded-[var(--radius-button)] bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)] hover:bg-destructive/90',
        outline:
          'rounded-[var(--radius-button)] border-2 border-border bg-background shadow-[var(--shadow-xs)] hover:border-[var(--bf-orange-border)] hover:bg-[var(--bf-orange-soft)] hover:text-foreground',
        secondary:
          'rounded-[var(--radius-button)] bg-secondary text-secondary-foreground shadow-[var(--shadow-xs)] hover:bg-secondary/80',
        ghost:
          'rounded-[var(--radius-button)] hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline font-semibold',
        success:
          'rounded-[var(--radius-button)] bg-success text-success-foreground shadow-[var(--shadow-sm)] hover:opacity-90'
      },
      size: {
        default: 'h-11 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-9 rounded-[var(--radius-button)] gap-1.5 px-3.5 text-sm has-[>svg]:px-3',
        lg: 'h-12 rounded-[var(--radius-button)] px-7 text-base has-[>svg]:px-5',
        icon: 'size-11 rounded-[var(--radius-button)]'
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
