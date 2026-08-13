'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MapPin, MoreHorizontal } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { useCityOptional } from '@/components/providers/city-provider';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getMainNavLinks } from '@/lib/layout/navigation';
import { useTranslations } from '@/components/providers';

/** Tablet’te sıkışmayı önlemek için birincil / ikincil ayrımı */
const PRIMARY_HREFS = new Set(['/', '/feed', '/etkinlikler', '/kategoriler']);

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const city = useCityOptional();
  const t = useTranslations();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const navLinks = getMainNavLinks(t);
  const primaryLinks = navLinks.filter((l) => PRIMARY_HREFS.has(l.href));
  const secondaryLinks = navLinks.filter((l) => !PRIMARY_HREFS.has(l.href));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  function linkActive(href: string) {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  }

  return (
    <header
      className={cn(
        'glass-header sticky top-0 z-50 w-full border-b text-[var(--header-fg)] transition-[box-shadow,background-color] duration-[var(--duration-normal)] ease-[var(--ease-out)]',
        scrolled || !isHome ? 'shadow-[var(--shadow-glass)]' : 'shadow-none'
      )}
    >
      {/* Tablet (md–lg): oranlara göre sıkı / akıllı nav */}
      <div
        className={cn(
          'container mx-auto hidden items-center justify-between md:flex lg:hidden',
          'px-[clamp(0.75rem,2vw,1.25rem)]',
          scrolled ? 'h-14' : 'h-[clamp(3.25rem,5.5vw,3.75rem)]'
        )}
      >
        <Logo
          variant="auto"
          className="shrink-0 scale-[clamp(0.92,0.05vw+0.9,1)]"
        />

        <nav
          className="mx-[clamp(0.25rem,1.5vw,0.75rem)] flex min-w-0 flex-1 items-center justify-center"
          aria-label="Ana menü"
        >
          <div
            className={cn(
              'flex max-w-full items-center',
              'gap-[clamp(0.125rem,0.8vw,0.5rem)]'
            )}
          >
            {primaryLinks.map((link) => {
              const active = linkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active ? 'true' : 'false'}
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-xl font-semibold transition-colors duration-200',
                    'min-h-10 px-[clamp(0.4rem,1.1vw,0.75rem)]',
                    'text-[clamp(0.7rem,1.55vw,0.8125rem)]',
                    'text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]',
                    active &&
                      'bg-[var(--header-hover)] text-[var(--bf-accent-ink)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-xl transition-colors',
                  'text-[var(--header-fg)] hover:bg-[var(--header-hover)]',
                  moreOpen &&
                    'bg-[var(--header-hover)] text-[var(--bf-accent-ink)]'
                )}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                aria-label="Daha fazla"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-lg"
                >
                  {city ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreOpen(false);
                        city.openCityPicker();
                      }}
                      className="flex min-h-11 w-full items-center gap-2 border-b border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
                    >
                      <MapPin className="size-4 text-[var(--bf-accent-ink)]" />
                      <span className="truncate">{city.cityName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {t.filters.changeCity}
                      </span>
                    </button>
                  ) : null}
                  {secondaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex min-h-11 items-center px-4 text-sm font-semibold text-foreground hover:bg-muted',
                        linkActive(link.href) && 'text-[var(--bf-accent-ink)]'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {!loading &&
            (user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link href="/giris">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-10 px-2.5 text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-[var(--header-fg)] hover:bg-[var(--header-hover)]"
                  >
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button
                    size="sm"
                    className="btn-gradient-primary min-h-10 rounded-[var(--radius-button)] px-3 text-[clamp(0.75rem,1.5vw,0.875rem)] font-bold text-primary-foreground"
                  >
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            ))}
        </div>
      </div>

      {/* Masaüstü (lg+): tam nav — şehir logo yanında değil */}
      <div
        className={cn(
          'container mx-auto hidden items-center justify-between gap-3 px-6 lg:flex',
          scrolled ? 'h-14' : 'h-16'
        )}
      >
        <Logo variant="auto" className="shrink-0" />

        <nav
          className="mx-4 flex min-w-0 flex-1 items-center justify-center"
          aria-label="Ana menü"
        >
          <div className="flex max-w-full items-center gap-2 xl:gap-3">
            {navLinks.map((link) => {
              const active = linkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active ? 'true' : 'false'}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 items-center rounded-xl px-3.5 text-sm font-semibold transition-colors duration-200',
                    'text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]',
                    active &&
                      'bg-[var(--header-hover)] text-[var(--bf-accent-ink)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {city ? (
            <button
              type="button"
              onClick={() => city.openCityPicker()}
              className={cn(
                'inline-flex max-w-[9.5rem] items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors',
                'text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]'
              )}
              aria-label={t.filters.changeCity}
            >
              <MapPin className="size-4 shrink-0 text-[var(--bf-accent-ink)]" aria-hidden />
              <span className="truncate">{city.cityName}</span>
            </button>
          ) : null}
          <ThemeToggle />
          {!loading &&
            (user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link href="/giris">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-10 font-semibold text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--header-fg)]"
                  >
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button
                    size="sm"
                    className="btn-gradient-primary min-h-10 rounded-[var(--radius-button)] px-5 font-bold text-primary-foreground shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                  >
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
