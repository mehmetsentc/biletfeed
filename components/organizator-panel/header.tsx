'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export function OrganizatorHeader({
  displayName,
  onMenuClick
}: {
  displayName: string;
  onMenuClick?: () => void;
}) {
  return (
    <header className="bg-organizer-header flex h-14 items-center justify-between border-b border-[var(--ticket-border)] px-4 text-white lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/organizator-panel/baslangic" className="flex items-center">
          <Logo href="/organizator-panel/baslangic" variant="on-dark" className="max-w-[140px]" />
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/"
          className="text-organizer-chrome-muted hidden transition-colors hover:text-white sm:inline"
        >
          Siteye Dön
        </Link>
        <span className="text-organizer-chrome rounded-md bg-white/10 px-3 py-1.5">
          {displayName}
        </span>
      </div>
    </header>
  );
}
