import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-12 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-[var(--bf-input-bg)] px-4 py-2.5 text-base text-foreground transition-all duration-[var(--duration-fast)] outline-none',
        'placeholder:text-[var(--bf-text-muted)]',
        'selection:bg-[var(--bf-neon-light-surface)] selection:text-[var(--bf-text)]',
        'focus-visible:border-[var(--bf-neon-pressed)] focus-visible:shadow-[var(--shadow-focus)]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bf-muted-surface)]',
        'aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--bf-danger)_22%,transparent)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
