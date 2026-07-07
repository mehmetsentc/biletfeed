'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/feed', label: 'Feed' }
] as const;

export function HomeFeedTabs({
  className,
  variant = 'light'
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const pathname = usePathname();

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'inline-flex rounded-full border p-1 shadow-sm',
          variant === 'dark'
            ? 'border-white/10 bg-white/5 md:border-border md:bg-card'
            : 'border-border bg-card'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : variant === 'dark'
                    ? 'text-zinc-400 hover:text-white md:text-muted-foreground md:hover:text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
