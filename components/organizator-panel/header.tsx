'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { siteHref } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

export function OrganizatorHeader({
  displayName: serverDisplayName,
  onMenuClick,
  mobileOpen
}: {
  displayName: string;
  onMenuClick?: () => void;
  /** Mobil menü açıkken header logosunu gizle (sidebar logosu görünsün) */
  mobileOpen?: boolean;
}) {
  const { user } = useAuth();
  const displayName =
    user?.displayName || user?.email || serverDisplayName || 'Organizatör';

  return (
    <header className="bg-organizer-header flex h-14 shrink-0 items-center justify-between border-b border-[var(--ticket-border)] px-4 text-white lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/10 lg:hidden"
          onClick={onMenuClick}
          aria-label="Menü"
        >
          <Menu className="size-5" />
        </Button>
        <Logo
          href="/organizator-panel/baslangic"
          variant="on-dark"
          className={cn(
            'max-w-[130px] lg:hidden',
            mobileOpen && 'hidden'
          )}
        />
      </div>

      <div className="flex items-center gap-3 text-sm sm:gap-4">
        <Link
          href={siteHref('/')}
          className="text-organizer-chrome-muted hidden transition-colors hover:text-white sm:inline"
        >
          Siteye Dön
        </Link>
        <span className="text-organizer-chrome hidden max-w-[10rem] truncate rounded-md bg-white/10 px-3 py-1.5 text-xs sm:inline sm:max-w-none sm:text-sm">
          {displayName}
        </span>
        <div className="[&_button]:text-white [&_button:hover]:bg-white/10 [&_span]:text-white">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
