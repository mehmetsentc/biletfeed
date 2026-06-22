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
    <header className="flex h-14 items-center justify-between border-b bg-[#1f2327] px-4 text-white lg:px-6">
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
          <span className="text-lg font-bold tracking-tight text-[#f5a623]">
            {siteConfig.name.split(' ')[0]}
          </span>
          <span className="hidden text-sm text-zinc-300 sm:inline">
            {ORGANIZATOR_BRAND.replace('Biletfeed ', '')}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/"
          className="hidden text-zinc-400 transition-colors hover:text-white sm:inline"
        >
          Siteye Dön
        </Link>
        <span className="rounded-md bg-white/10 px-3 py-1.5 text-zinc-100">
          {displayName}
        </span>
      </div>
    </header>
  );
}
