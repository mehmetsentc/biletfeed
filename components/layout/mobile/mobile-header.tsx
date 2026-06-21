'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { CitySelectorButton } from '@/components/location/city-selector-button';
import { Logo } from '@/components/brand/logo';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] text-[var(--header-fg)] lg:hidden',
        !isHome && 'shadow-sm'
      )}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Logo variant="on-dark" className="scale-90 ring-[var(--header-border)]" />

        <CitySelectorButton />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--header-fg)] hover:bg-[var(--header-hover)]"
            asChild
          >
            <Link href="/etkinlikler" aria-label="Etkinlik ara">
              <Search className="size-5" />
            </Link>
          </Button>

          {!loading && (
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--header-fg)] hover:bg-[var(--header-hover)]"
              asChild
            >
              <Link
                href={user ? '/profil' : '/giris'}
                aria-label={user ? 'Profil' : 'Giriş yap'}
              >
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="size-7 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <User className="size-5" />
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
