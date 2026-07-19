'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCity } from '@/components/providers/city-provider';
import { PopularEventsSection } from '@/components/home/popular-events-section';
import { EventifyCard } from '@/components/events/eventify-card';
import { Button } from '@/components/ui/button';
import type { HomeCityEventsBundle } from '@/lib/services/home-city-events';

const countryMap: Record<string, string> = {
  istanbul: 'Türkiye',
  ankara: 'Türkiye',
  izmir: 'Türkiye',
  antalya: 'Türkiye',
  bursa: 'Türkiye',
  eskisehir: 'Türkiye',
  online: 'Online'
};

interface HomeCityEventsProps {
  initial: HomeCityEventsBundle;
}

export function HomeCityEvents({ initial }: HomeCityEventsProps) {
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
      .catch(() => {
        // Önceki etkinlik listesi korunur; kullanıcı tekrar deneyebilir
      })
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
    <>
      {loading && (
        <div className="flex items-center justify-center gap-2 border-b border-border bg-muted/30 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-[var(--bf-accent-ink)]" />
          {displayName} etkinlikleri yükleniyor…
        </div>
      )}

      <PopularEventsSection
        events={data.heroEvents}
        cityName={displayName}
        citySlug={displaySlug}
      />

      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold md:text-3xl">
            {displayName}&apos;da Yaklaşan Etkinlikler
          </h2>
          <p className="mt-2 text-muted-foreground">
            Biletix, Bubilet, Biletimo ve diğer kaynaklardan güncel etkinlikler
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.displayTrending.slice(0, 6).map((event) => (
              <EventifyCard
                key={event.id}
                event={event}
                countryBadge={countryMap[event.citySlug] ?? 'Türkiye'}
              />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href={`/etkinlikler?sehir=${displaySlug}`}>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] rounded-md border-foreground/20 px-12 font-semibold"
              >
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
