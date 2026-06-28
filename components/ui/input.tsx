import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-[var(--radius-input)] border-2 border-input bg-background px-4 py-2 text-base text-foreground shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] outline-none',
        'placeholder:text-muted-foreground',
        'selection:bg-primary selection:text-primary-foreground',
        'focus-visible:border-primary focus-visible:shadow-[var(--shadow-focus)]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--bf-danger)_25%,transparent)]',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
