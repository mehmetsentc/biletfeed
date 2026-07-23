'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { adminHref } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

export type MuhasebeTabKey =
  | 'satis'
  | 'faturalar'
  | 'hakedis'
  | 'vergi'
  | 'operasyon'
  | 'izleme';

const TAB_DEFS: ReadonlyArray<{
  key: MuhasebeTabKey;
  label: string;
  href: string;
}> = [
  { key: 'satis', label: 'Satış özeti', href: adminHref('/muhasebe') },
  {
    key: 'faturalar',
    label: 'Faturalar (GİB)',
    href: adminHref('/muhasebe?tab=faturalar')
  },
  {
    key: 'hakedis',
    label: 'Hakediş',
    href: adminHref('/muhasebe?tab=hakedis')
  },
  {
    key: 'vergi',
    label: 'Vergi & raporlar',
    href: adminHref('/muhasebe?tab=vergi')
  },
  {
    key: 'operasyon',
    label: 'Mutabakat & gider',
    href: adminHref('/muhasebe?tab=operasyon')
  },
  {
    key: 'izleme',
    label: 'İzleme',
    href: adminHref('/muhasebe?tab=izleme')
  }
];

export function MuhasebeTabs({
  active,
  badges,
  children
}: {
  active: MuhasebeTabKey;
  badges?: Partial<Record<MuhasebeTabKey, number>>;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-1 border-b border-border/80 bg-[var(--bf-surface)]/95 px-1 py-2 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Muhasebe sekmeleri"
          className="flex flex-wrap gap-1.5"
        >
          {TAB_DEFS.map((tab) => {
            const isActive = active === tab.key;
            const badge = badges?.[tab.key] ?? 0;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-button)] px-3 py-1.5 text-sm transition-colors duration-[var(--duration-fast)]',
                  isActive
                    ? 'bg-primary font-bold text-primary-foreground shadow-[var(--shadow-sm)]'
                    : 'font-semibold text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
                {badge > 0 && (
                  <span
                    className={cn(
                      'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-destructive/15 text-destructive'
                    )}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
