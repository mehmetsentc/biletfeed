'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: 'Etkinlikler',
    icon: Home,
    match: (p: string) =>
      p === '/' || p.startsWith('/etkinlikler') || p.startsWith('/etkinlik/') ||
      p.startsWith('/kategoriler') || p.startsWith('/sehirler')
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
      p.startsWith('/profil') || p === '/giris' || p === '/kayit' ||
      p.startsWith('/organizator-panel') || p === '/degerlendirmelerim'
  }
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div className="flex items-stretch justify-around px-1 pb-2 pt-1">
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors',
                active
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon
                className={cn('size-[22px] transition-transform', active && 'scale-110')}
                strokeWidth={active ? 2.25 : 1.6}
                fill={active && item.href === '/favorilerim' ? 'currentColor' : 'none'}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
