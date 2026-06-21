'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Home,
  MessageCircle,
  Plus,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENTJOY_RED = '#E53935';

const navItems = [
  { href: '/eventjoy/panel', label: 'Ana Sayfa', icon: Home, match: (p: string) => p === '/eventjoy/panel' },
  {
    href: '/eventjoy/etkinlikler',
    label: 'Etkinlikler',
    icon: Calendar,
    match: (p: string) =>
      p.startsWith('/eventjoy/etkinlik') ||
      p.startsWith('/eventjoy/misafirler') ||
      p === '/eventjoy/etkinlikler'
  },
  { href: '/eventjoy/yeni', label: 'Oluştur', icon: Plus, isCenter: true },
  {
    href: '/eventjoy/mesajlar',
    label: 'Mesajlar',
    icon: MessageCircle,
    match: (p: string) => p.startsWith('/eventjoy/mesajlar')
  },
  {
    href: '/eventjoy/profil',
    label: 'Profil',
    icon: User,
    match: (p: string) => p.startsWith('/eventjoy/profil')
  }
];

const hideNavPaths = ['/eventjoy/yeni'];

export function EventJoyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = hideNavPaths.some((p) => pathname.startsWith(p));
  const isSubPage =
    pathname.includes('/misafirler/') ||
    (pathname.startsWith('/eventjoy/mesajlar/') && pathname !== '/eventjoy/mesajlar') ||
    pathname.includes('/profil/') ||
    !!pathname.match(/\/etkinlik\/[^/]+\/(gorevler|butce)/);

  return (
    <div className="relative mx-auto min-h-screen max-w-[430px] bg-[#FAFAFA] shadow-2xl">
      {/* Status bar mock */}
      <div className="flex h-11 items-center justify-between bg-background px-6 text-xs font-medium">
        <span>10:30</span>
        <div className="mx-auto size-6 rounded-full bg-black/90" />
        <div className="flex gap-1">
          <span className="size-3 rounded-sm bg-foreground/80" />
          <span className="size-3 rounded-sm bg-foreground/80" />
        </div>
      </div>

      <main className={cn('min-h-[calc(100vh-7rem)]', hideNav || isSubPage ? 'pb-4' : 'pb-24')}>
        {children}
      </main>

      {!hideNav && !isSubPage && (
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t bg-white">
          <div className="flex items-end justify-around px-2 pb-5 pt-2">
            {navItems.map((item) => {
              const active = item.match?.(pathname) ?? pathname === item.href;

              if (item.isCenter) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-1 -mt-4"
                  >
                    <span
                      className="flex size-12 items-center justify-center rounded-full text-white shadow-lg"
                      style={{ backgroundColor: EVENTJOY_RED }}
                    >
                      <Plus className="size-6" strokeWidth={2.5} />
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
                    active ? 'text-[#E53935]' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function EventJoyHeader({
  title,
  backHref,
  rightAction
}: {
  title: string;
  backHref: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-bold">{title}</h1>
      </div>
      {rightAction}
    </header>
  );
}

export function GuestStatusLabel({ status }: { status: string }) {
  if (status === 'confirmed') {
    return <span className="text-sm font-medium text-emerald-600">Evet</span>;
  }
  if (status === 'declined') {
    return <span className="text-sm font-medium text-[#E53935]">Hayır</span>;
  }
  return <span className="text-sm font-medium text-sky-600">Yanıt Bekleniyor</span>;
}

export { EVENTJOY_RED };
