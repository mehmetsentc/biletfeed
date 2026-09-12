'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartOptional } from '@/components/providers/cart-provider';
import { cn } from '@/lib/utils';

export function CartNavButton({
  className,
  iconClassName
}: {
  className?: string;
  iconClassName?: string;
}) {
  const cart = useCartOptional();
  const count = cart?.hydrated ? cart.ticketCount : 0;

  return (
    <Link
      href="/sepet"
      className={cn(
        'relative inline-flex size-9 items-center justify-center rounded-lg text-[var(--header-fg)] transition-colors hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]',
        className
      )}
      aria-label={count > 0 ? `Bilet Sepeti (${count})` : 'Bilet Sepeti'}
    >
      <ShoppingBag className={cn('size-5', iconClassName)} aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
