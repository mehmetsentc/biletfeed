'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { useCityOptional } from '@/components/providers/city-provider';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getMainNavLinks } from '@/lib/layout/navigation';
import { useTranslations } from '@/components/providers';

/**
 * Breakpoint şeridi (site chrome):
 * - Telefon: 0–767 (md altı)
 * - Tablet: 768–1279 (md–xl) — tüm linkler satırda, kompakt tipografi
 * - Masaüstü: 1280+ (xl)
 */
export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const city = useCityOptional();
  const t = useTranslations();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const navLinks = getMainNavLinks(t);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      {/* Tablet (md–xl): tüm linkler satırda — ⋯ menü yok */}
      <div
        className={cn(
          'container mx-auto hidden items-center justify-between gap-2 md:flex xl:hidden',
          'px-[clamp(0.5rem,1.5vw,1rem)]',
          scrolled ? 'h-14' : 'h-[clamp(3.25rem,5.5vw,3.75rem)]'
        )}
      >
        <Logo
          variant="auto"
          className="shrink-0 scale-[clamp(0.88,0.04vw+0.86,1)]"
        />

        <nav
          className="flex min-w-0 flex-1 items-center justify-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Ana menü"
        >
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navLinks.map((link) => {
              const active = linkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active ? 'true' : 'false'}
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-lg font-semibold transition-colors duration-200',
                    'min-h-9 px-1.5 sm:px-2 md:px-2.5',
                    'text-[clamp(0.65rem,1.35vw,0.8125rem)]',
                    'whitespace-nowrap text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]',
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

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {city ? (
            <button
              type="button"
              onClick={() => city.openCityPicker()}
              className={cn(
                'inline-flex max-w-[6.5rem] items-center gap-1 rounded-lg px-1.5 py-1.5 text-[clamp(0.65rem,1.3vw,0.75rem)] font-semibold transition-colors',
                'text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]'
              )}
              aria-label={t.filters.changeCity}
            >
              <MapPin
                className="size-3.5 shrink-0 text-[var(--bf-accent-ink)]"
                aria-hidden
              />
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
                    className="min-h-9 px-2 text-[clamp(0.7rem,1.4vw,0.8125rem)] font-semibold text-[var(--header-fg)] hover:bg-[var(--header-hover)]"
                  >
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/kayit" className="hidden min-[900px]:block">
                  <Button
                    size="sm"
                    className="btn-gradient-primary min-h-9 rounded-[var(--radius-button)] px-2.5 text-[clamp(0.7rem,1.4vw,0.8125rem)] font-bold text-primary-foreground"
                  >
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            ))}
        </div>
      </div>

      {/* Masaüstü (xl+): tam nav + satır içi şehir */}
      <div
        className={cn(
          'container mx-auto hidden items-center justify-between gap-3 px-6 xl:flex',
          scrolled ? 'h-14' : 'h-16'
        )}
      >
        <Logo variant="auto" className="shrink-0" />

        <nav
          className="mx-4 flex min-w-0 flex-1 items-center justify-center"
          aria-label="Ana menü"
        >
          <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 2xl:gap-3">
            {navLinks.map((link) => {
              const active = linkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active ? 'true' : 'false'}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-semibold transition-colors duration-200 2xl:px-3.5',
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
              <MapPin
                className="size-4 shrink-0 text-[var(--bf-accent-ink)]"
                aria-hidden
              />
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
