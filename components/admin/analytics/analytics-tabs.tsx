'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/providers';

export type AnalyticsTabKey = 'business' | 'traffic';

export function AnalyticsTabs({
  active,
  business,
  traffic
}: {
  active: AnalyticsTabKey;
  business: ReactNode;
  traffic: ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  // admin.biletfeed.com/analitik → /analitik ; localhost /admin/analitik → /admin/analitik
  const base = pathname.startsWith('/admin') ? '/admin/analitik' : '/analitik';

  const tabs = useMemo(
    () =>
      [
        {
          key: 'business' as const,
          label: t.admin.analyticsPage.tabBusiness,
          href: base
        },
        {
          key: 'traffic' as const,
          label: t.admin.analyticsPage.tabTraffic,
          href: `${base}?tab=traffic`
        }
      ] as const,
    [base, t.admin.analyticsPage.tabBusiness, t.admin.analyticsPage.tabTraffic]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            asChild
            size="sm"
            variant={active === tab.key ? 'default' : 'outline'}
          >
            <Link href={tab.href}>{tab.label}</Link>
          </Button>
        ))}
      </div>
      {active === 'business' ? business : traffic}
    </div>
  );
}
