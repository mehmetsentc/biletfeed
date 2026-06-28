'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { ORGANIZATOR_BRAND } from '@/components/organizator-panel/sidebar';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/config/site';

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
        <Link href="/organizator-panel/baslangic" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-primary">
            {siteConfig.name.split(' ')[0]}
          </span>
          <span className="text-organizer-chrome hidden text-sm sm:inline">
            {ORGANIZATOR_BRAND.replace('Biletfeed ', '')}
          </span>
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
