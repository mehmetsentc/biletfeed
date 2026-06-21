'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, Plus, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: 'Keşfet',
    icon: Home,
    match: (p: string) => p === '/'
  },
  {
    href: '/etkinlikler',
    label: 'Etkinlikler',
    icon: CalendarDays,
    match: (p: string) =>
      p.startsWith('/etkinlikler') ||
      p.startsWith('/etkinlik/') ||
      p.startsWith('/kategoriler') ||
      p.startsWith('/sehirler')
  },
  {
    href: '/dashboard/etkinlik/yeni',
    label: 'Oluştur',
    icon: Plus,
    isCenter: true
  },
  {
    href: '/biletlerim',
    label: 'Biletler',
    icon: Ticket,
    match: (p: string) => p.startsWith('/biletlerim')
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: User,
    match: (p: string) =>
      p.startsWith('/profil') ||
      p === '/favorilerim' ||
      p === '/giris' ||
      p === '/kayit'
  }
] as const;

function isNavActive(
  item: (typeof navItems)[number],
  pathname: string
): boolean {
  if ('isCenter' in item) return false;
  return item.match(pathname);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--header-border)] bg-[var(--header-bg)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Ana navigasyon"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-2 pt-1.5">
        {navItems.map((item) => {
          if ('isCenter' in item && item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-5"
                aria-label={item.label}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Plus className="size-6" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-[var(--header-fg-muted)]">
                  {item.label}
                </span>
              </Link>
            );
          }

          const active = isNavActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors',
                active
                  ? 'text-primary'
                  : 'text-[var(--header-fg-muted)] hover:text-[var(--header-fg)]'
              )}
            >
              <item.icon
                className="size-5"
                strokeWidth={active ? 2.25 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
