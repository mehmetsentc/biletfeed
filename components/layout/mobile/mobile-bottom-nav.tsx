'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, Star, Ticket, User } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAccountMode } from '@/hooks/use-account-mode';
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
    href: '/biletlerim',
    label: 'Biletler',
    icon: Ticket,
    match: (p: string) => p.startsWith('/biletlerim')
  },
  {
    href: '/favorilerim',
    label: 'Favoriler',
    icon: Star,
    match: (p: string) => p === '/favorilerim'
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: User,
    match: (p: string) =>
      p.startsWith('/profil') ||
      p === '/degerlendirmelerim' ||
      p === '/giris' ||
      p === '/kayit' ||
      p.startsWith('/organizator-panel')
  }
] as const;

function isNavActive(
  item: (typeof navItems)[number],
  pathname: string
): boolean {
  return item.match(pathname);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isOrganizerMode } = useAccountMode();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--header-border)] bg-[var(--header-bg)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Ana navigasyon"
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-2 pt-1.5">
        {navItems.map((item) => {
          const active = isNavActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors',
                active
                  ? 'text-primary'
                  : 'text-[var(--header-fg-muted)] hover:text-[var(--header-fg)]',
                item.href === '/profil' &&
                  user &&
                  isOrganizerMode &&
                  'relative after:absolute after:right-2 after:top-1.5 after:size-1.5 after:rounded-full after:bg-primary'
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
