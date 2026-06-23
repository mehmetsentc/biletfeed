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
import { siteConfig } from '@/lib/config/site';
import { brandTheme } from '@/lib/config/brand-theme';
import { cn } from '@/lib/utils';

/** @deprecated primary / brand-orange kullanın */
export const EVENTJOY_RED = brandTheme.orange;

const navItems = [
  {
    href: '/eventjoy/panel',
    label: 'Ana Sayfa',
    icon: Home,
    match: (p: string) => p === '/eventjoy/panel'
  },
  {
    href: '/eventjoy/etkinlikler',
    label: 'Etkinlikler',
    icon: Calendar,
    match: (p: string) =>
      p.startsWith('/eventjoy/etkinlik') ||
      p.startsWith('/eventjoy/misafirler') ||
      p === '/eventjoy/etkinlikler'
  },
  {
    href: '/eventjoy/yeni',
    label: 'Oluştur',
    icon: Plus,
    isCenter: true,
    match: () => false
  },
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

function NavLink({
  item,
  pathname,
  variant
}: {
  item: (typeof navItems)[number];
  pathname: string;
  variant: 'sidebar' | 'bottom';
}) {
  const active = item.match?.(pathname) ?? pathname === item.href;

  if (item.isCenter && variant === 'bottom') {
    return (
      <Link
        href={item.href}
        className="flex flex-col items-center gap-1 -mt-5"
        aria-label="Yeni etkinlik oluştur"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 active:scale-95">
          <Plus className="size-7" strokeWidth={2.5} />
        </span>
      </Link>
    );
  }

  if (item.isCenter) return null;

  if (variant === 'sidebar') {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/15 text-primary'
            : 'text-zinc-300 hover:bg-white/5 hover:text-white'
        )}
      >
        <item.icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex min-w-[4rem] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <item.icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      {item.label}
    </Link>
  );
}

function EventJoyTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1f2327] px-4 text-white lg:px-6">
      <Link href="/eventjoy/panel" className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-[#f5a623]">
          {siteConfig.name.split(' ')[0]}
        </span>
        <span className="text-sm text-zinc-300">EventJoy</span>
      </Link>
      <Link
        href="/"
        className="text-xs text-zinc-400 transition hover:text-white sm:text-sm"
      >
        Siteye Dön
      </Link>
    </header>
  );
}

export function EventJoyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = hideNavPaths.some((p) => pathname.startsWith(p));
  const isSubPage =
    pathname.includes('/misafirler/') ||
    (pathname.startsWith('/eventjoy/mesajlar/') &&
      pathname !== '/eventjoy/mesajlar') ||
    pathname.includes('/profil/') ||
    !!pathname.match(/\/etkinlik\/[^/]+\/(gorevler|butce)/);

  const showNav = !hideNav && !isSubPage;

  return (
    <div className="organizer-surface flex min-h-screen flex-col bg-[#eef0f2]">
      <EventJoyTopBar />

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {showNav && (
          <aside className="hidden w-64 shrink-0 flex-col bg-[#2b3035] text-zinc-100 lg:flex">
            <div className="border-b border-white/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                EventJoy
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-200">
                Küçük etkinlik planlayıcı
              </p>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  variant="sidebar"
                />
              ))}
            </nav>
            <div className="m-3 rounded-xl border border-white/10 bg-[#1f2327] p-4">
              <p className="text-sm font-semibold text-white">Yeni etkinlik</p>
              <p className="mt-1 text-xs text-zinc-400">
                Davetiye ve misafir listesini hazırlayın.
              </p>
              <Link
                href="/eventjoy/yeni"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="size-3.5" />
                Oluştur
              </Link>
            </div>
          </aside>
        )}

        <main
          className={cn(
            'min-h-0 flex-1',
            showNav ? 'pb-24 lg:pb-8' : 'pb-4'
          )}
        >
          <div
            className={cn(
              'mx-auto w-full',
              showNav
                ? 'max-w-lg lg:max-w-none lg:px-8 lg:py-8'
                : 'max-w-2xl lg:max-w-4xl lg:px-8 lg:py-6'
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-end justify-around px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                variant="bottom"
              />
            ))}
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md lg:static lg:rounded-xl lg:border lg:shadow-sm">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="flex size-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
          aria-label="Geri"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-bold text-foreground">{title}</h1>
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
    return <span className="text-sm font-medium text-destructive">Hayır</span>;
  }
  return <span className="text-sm font-medium text-sky-600">Yanıt Bekleniyor</span>;
}
