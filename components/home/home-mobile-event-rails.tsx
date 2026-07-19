'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCity } from '@/components/providers/city-provider';
import { useTranslations } from '@/components/providers';
import { HomeEventScrollRail } from '@/components/home/home-event-scroll-rail';
import type { HomeCityEventsBundle } from '@/lib/services/home-city-events';
import { useEffect, useRef, useState } from 'react';

type HomeMobileEventRailsProps = {
  initial: HomeCityEventsBundle;
};

export function HomeMobileEventRails({ initial }: HomeMobileEventRailsProps) {
  const t = useTranslations();
  const { citySlug, cityName } = useCity();
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const activeSlugRef = useRef(initial.citySlug);

  useEffect(() => {
    if (citySlug === activeSlugRef.current) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/events/by-city?sehir=${encodeURIComponent(citySlug)}`, {
      credentials: 'same-origin'
    })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<HomeCityEventsBundle>;
      })
      .then((bundle) => {
        if (cancelled) return;
        activeSlugRef.current = bundle.citySlug;
        setData(bundle);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [citySlug, cityName]);

  const displayName = cityName || data.cityName;
  const displaySlug = citySlug || data.citySlug;

  return (
    <div className="border-b border-border/60 bg-background md:hidden">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-[var(--bf-accent-ink)]" />
          {t.common.loading}
        </div>
      )}

      <HomeEventScrollRail
        title={t.home.popularInCity(displayName)}
        events={data.popularEvents}
        href={`/etkinlikler?sehir=${displaySlug}`}
      />

      {data.categorySections.map((section) => (
        <HomeEventScrollRail
          key={section.slug}
          title={section.name}
          events={section.events}
          href={`/etkinlikler?sehir=${displaySlug}&kategori=${section.slug}`}
        />
      ))}

      <HomeEventScrollRail
        title={t.home.bestsellers}
        events={data.bestSellers}
        href={`/etkinlikler?sehir=${displaySlug}`}
      />

      <div className="px-4 pb-6">
        <Link
          href={`/etkinlikler?sehir=${displaySlug}`}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground shadow-[var(--shadow-xs)]"
        >
          {t.nav.allEvents}
        </Link>
      </div>
    </div>
  );
}
