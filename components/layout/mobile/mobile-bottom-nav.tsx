'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Ticket, User, Newspaper } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useTranslations();
  const accountHref = user ? '/profil' : '/giris?redirect=%2Fprofil';

  const navItems = [
    {
      href: '/',
      label: t.mobileNav.home,
      icon: Home,
      match: (p: string) =>
        p === '/' ||
        p.startsWith('/etkinlikler') ||
        p.startsWith('/etkinlik/') ||
        p.startsWith('/kategoriler') ||
        p.startsWith('/sehirler')
    },
    {
      href: '/feed',
      label: t.chrome.feed,
      icon: Newspaper,
      match: (p: string) => p === '/feed' || p.startsWith('/feed/')
    },
    {
      href: '/favorilerim',
      label: t.account.favorites,
      icon: Heart,
      match: (p: string) => p === '/favorilerim'
    },
    {
      href: '/biletlerim',
      label: t.mobileNav.tickets,
      icon: Ticket,
      match: (p: string) => p.startsWith('/biletlerim') || p.startsWith('/bilet/')
    },
    {
      href: '/profil',
      label: t.mobileNav.profile,
      icon: User,
      match: (p: string) =>
        p.startsWith('/profil') ||
        p === '/giris' ||
        p === '/kayit' ||
        p.startsWith('/organizator-panel') ||
        p === '/degerlendirmelerim'
    }
  ] as const;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 lg:hidden',
        'border-t border-[var(--header-border)] bg-[var(--header-bg)]',
        'pb-[env(safe-area-inset-bottom)]',
        'shadow-[var(--shadow-md)]'
      )}
    >
      <div className="flex items-stretch justify-around px-1 pb-2 pt-1.5">
        {navItems.map((item) => {
          const href = item.href === '/profil' ? accountHref : item.href;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5',
                'text-[10px] font-semibold transition-colors duration-200',
                active
                  ? 'text-primary'
                  : 'text-[var(--header-fg-muted)] hover:text-[var(--header-fg)]'
              )}
            >
              <item.icon
                className={cn('size-5', active && 'stroke-[2.5]')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
