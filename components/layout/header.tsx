'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CitySelectorButton } from '@/components/location/city-selector-button';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { getMainNavLinks } from '@/lib/layout/navigation';
import { useTranslations } from '@/components/providers';

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
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

  return (
    <header
      className={cn(
        'glass-header sticky top-0 z-50 w-full border-b text-[var(--header-fg)] transition-[box-shadow,background-color] duration-[var(--duration-normal)] ease-[var(--ease-out)]',
        scrolled || !isHome ? 'shadow-[var(--shadow-glass)]' : 'shadow-none'
      )}
    >
      <div
        className={cn(
          'container mx-auto flex items-center justify-between px-4 transition-[height] duration-[var(--duration-normal)] ease-[var(--ease-out)] md:px-6',
          scrolled ? 'h-14' : 'h-14 md:h-16'
        )}
      >
        <Logo
          variant="auto"
          className="ml-0.5 shrink-0 md:ml-1"
        />

        <nav className="hidden items-center gap-7 md:flex">
          <CitySelectorButton className="hidden md:inline-flex" />
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active ? 'true' : 'false'}
                className={cn(
                  'nav-link-premium text-sm font-semibold text-[var(--header-fg)] transition-colors duration-200 hover:text-[var(--bf-accent-ink)]',
                  active && 'text-[var(--bf-accent-ink)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {!loading && (
            <div className="flex items-center gap-2">
              {user ? (
                <ProfileDropdown />
              ) : (
                <>
                  <Link href="/giris">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-semibold text-[var(--header-fg)] transition-colors duration-200 hover:bg-[var(--header-hover)] hover:text-[var(--header-fg)]"
                    >
                      {t.nav.login}
                    </Button>
                  </Link>
                  <Link href="/kayit">
                    <Button
                      size="sm"
                      className="btn-gradient-primary rounded-[var(--radius-button)] px-5 font-bold text-primary-foreground shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-200 hover:shadow-[var(--shadow-md)]"
                    >
                      {t.nav.register}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
