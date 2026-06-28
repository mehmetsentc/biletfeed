'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { siteConfig } from '@/lib/config/site';
import {
  eventJoyCreateNav,
  eventJoyNavItems,
  eventJoyRoutes,
  isEventJoySubPage,
  type EventJoyNavItem
} from '@/lib/eventjoy/navigation';
import { cn } from '@/lib/utils';

/** @deprecated primary / brand-orange kullanın */
export const EVENTJOY_ORANGE = '#FF8A00';
/** @deprecated Use EVENTJOY_ORANGE */
export const EVENTJOY_RED = EVENTJOY_ORANGE;

function NavTab({
  item,
  pathname
}: {
  item: EventJoyNavItem;
  pathname: string;
}) {
  const active = item.match(pathname);

  return (
    <Link
      href={item.href}
      prefetch
      scroll
      onClick={(e) => {
        if (pathname === item.href) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      className={cn(
        'relative z-20 inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'text-organizer-chrome hover:bg-white/8 hover:text-white'
      )}
    >
      <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      <span>{item.label}</span>
    </Link>
  );
}

function EventJoyTopBar() {
  const { user } = useAuth();
  const displayName =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Hesabım';

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1f2327] px-4 text-white lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Logo href={eventJoyRoutes.siteHome} variant="on-dark" className="h-8 w-auto ring-0" />
        <Link
          href={eventJoyRoutes.panel}
          className="hidden rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary/25 sm:inline"
        >
          EventJoy
        </Link>
      </div>

      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <Link
          href={eventJoyRoutes.events}
          className="text-organizer-chrome-muted hidden transition hover:text-white md:inline"
        >
          Etkinliklerim
        </Link>
        <Link
          href={eventJoyRoutes.siteHome}
          className="text-organizer-chrome-muted hidden transition hover:text-white sm:inline"
        >
          {siteConfig.name}
        </Link>
        <Link
          href={eventJoyRoutes.profile}
          className="text-organizer-chrome max-w-[140px] truncate rounded-md bg-white/10 px-3 py-1.5 transition hover:bg-white/15 sm:max-w-none"
        >
          {displayName}
        </Link>
      </div>
    </header>
  );
}

function EventJoyNavBar({ pathname }: { pathname: string }) {
  const CreateIcon = eventJoyCreateNav.icon;

  return (
    <nav
      aria-label="EventJoy"
      className="sticky top-14 z-40 border-b border-white/10 bg-[#2b3035]"
    >
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-3 lg:px-8 [&::-webkit-scrollbar]:hidden">
        <Link
          href={eventJoyCreateNav.href}
          prefetch
          scroll
          className={cn(
            'relative z-20 inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2',
            'text-sm font-semibold text-primary-foreground transition hover:bg-primary/90',
            'sticky left-0 shadow-[6px_0_14px_rgba(43,48,53,0.95)]'
          )}
        >
          <CreateIcon className="size-4" strokeWidth={2.25} />
          <span className="hidden sm:inline">{eventJoyCreateNav.labelDesktop}</span>
          <span className="sm:hidden">{eventJoyCreateNav.label}</span>
        </Link>

        {eventJoyNavItems.map((item) => (
          <NavTab key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

export function EventJoyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSubPage = isEventJoySubPage(pathname);
  const showNav = !isSubPage;

  return (
    <div className="organizer-surface flex min-h-screen flex-col bg-[#eef0f2]">
      <EventJoyTopBar />
      {showNav && <EventJoyNavBar pathname={pathname} />}

      <main
        className={cn(
          'min-w-0 flex-1 w-full overflow-auto',
          isSubPage ? 'p-4 md:p-6 lg:p-8' : 'p-4 md:p-6 lg:px-8 lg:py-8'
        )}
      >
        {children}
      </main>
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
    <header className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={backHref}
          prefetch
          scroll
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
          aria-label="Geri"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
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
