'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Ticket } from 'lucide-react';
import { CitySelectorButton } from '@/components/location/city-selector-button';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import {
  HeaderIconLink,
  ProfileDropdown
} from '@/components/layout/profile-dropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { canAccessDashboard } from '@/lib/auth/permissions';
import { mainNavLinks } from '@/lib/layout/navigation';

const desktopBtnOutlineClass =
  'border-[var(--header-btn-outline)] bg-transparent text-[var(--header-fg)] hover:bg-[var(--header-hover)]';

export function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-[var(--header-border)] bg-[var(--header-bg)] text-[var(--header-fg)]',
        !isHome && 'shadow-lg'
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Logo
          variant="on-dark"
          className="ring-[var(--header-border)] hover:ring-primary/80"
        />

        <nav className="flex items-center gap-6">
          <CitySelectorButton className="hidden lg:inline-flex" />
          {mainNavLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative pb-1 text-sm font-semibold text-[var(--header-fg)] transition-colors hover:text-primary',
                  active && 'text-primary'
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/etkinlik/yeni"
            className="text-sm font-semibold text-[var(--header-fg)] transition-colors hover:text-primary"
          >
            Etkinlik Oluştur
          </Link>

          {!loading && (
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <HeaderIconLink
                    href="/biletlerim"
                    icon={Ticket}
                    label="Biletler"
                    active={pathname.startsWith('/biletlerim')}
                  />
                  <HeaderIconLink
                    href="/favorilerim"
                    icon={Star}
                    label="İlgilenilen"
                    active={pathname === '/favorilerim'}
                  />
                  <ProfileDropdown />
                  {canAccessDashboard(user.role) && (
                    <Link href="/dashboard">
                      <Button
                        variant="outline"
                        size="sm"
                        className={desktopBtnOutlineClass}
                      >
                        Panel
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/giris">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-semibold text-[var(--header-fg)] hover:bg-[var(--header-hover)] hover:text-[var(--header-fg)]"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/kayit">
                    <Button
                      size="sm"
                      className="rounded-md bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      Kayıt Ol
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
