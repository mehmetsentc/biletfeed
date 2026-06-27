'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const BRAND_ORANGE = '#FF9900';

const navItems = [
  {
    href: '/',
    label: 'Etkinlikler',
    icon: Home,
    match: (p: string) =>
      p === '/' ||
      p.startsWith('/etkinlikler') ||
      p.startsWith('/etkinlik/') ||
      p.startsWith('/kategoriler') ||
      p.startsWith('/sehirler')
  },
  {
    href: '/favorilerim',
    label: 'Favorilerim',
    icon: Heart,
    match: (p: string) => p === '/favorilerim'
  },
  {
    href: '/biletlerim',
    label: 'Biletlerim',
    icon: Ticket,
    match: (p: string) => p.startsWith('/biletlerim') || p.startsWith('/bilet/')
  },
  {
    href: '/profil',
    label: 'Hesabım',
    icon: User,
    match: (p: string) =>
      p.startsWith('/profil') ||
      p === '/giris' ||
      p === '/kayit' ||
      p.startsWith('/organizator-panel') ||
      p === '/degerlendirmelerim'
  }
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 lg:hidden',
        'border-t border-[var(--header-border)] bg-[var(--header-bg)]',
        'pb-[env(safe-area-inset-bottom)]',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.35)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)]'
      )}
    >
      <div className="flex items-stretch justify-around px-1 pb-2 pt-1.5">
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5',
                'text-[10px] font-semibold transition-colors duration-200',
                active
                  ? 'text-[#FF9900]'
                  : 'text-[var(--header-fg-muted)] hover:text-[var(--header-fg)]'
              )}
            >
              <item.icon
                className={cn(
                  'size-[22px] transition-all duration-200',
                  active && 'scale-105'
                )}
                strokeWidth={active ? 2.25 : 1.75}
                fill={active ? 'currentColor' : 'none'}
                style={
                  active
                    ? { filter: `drop-shadow(0 0 6px ${BRAND_ORANGE}66)` }
                    : undefined
                }
                aria-hidden
              />
              <span className="truncate leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
