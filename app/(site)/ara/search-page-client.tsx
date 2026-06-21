'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { EventCard } from '@/components/events/event-card';
import { Input } from '@/components/ui/input';
import type { MockEvent } from '@/lib/data/mock-events';

function SearchResults({ events }: { events: MockEvent[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);

  const results = useMemo(() => {
    if (!query) return events;
    const lower = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        e.city.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower) ||
        e.venue.toLowerCase().includes(lower)
    );
  }, [query, events]);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Etkinlik, mekan veya şehir ara..."
            className="h-12 rounded-full pl-12"
          />
        </div>
      </div>
      <div className="container mx-auto px-4 pb-12">
        <p className="mb-6 text-muted-foreground">
          {results.length} sonuç bulundu
          {query && ` "${query}" için`}
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </>
  );
}

export function SearchPageClient({ events }: { events: MockEvent[] }) {
  return (
    <>
      <PageHero title="Etkinlik Ara" subtitle="Binlerce etkinlik arasından arayın" />
      <Suspense fallback={<div className="container px-4 py-12">Yükleniyor...</div>}>
        <SearchResults events={events} />
      </Suspense>
    </>
  );
}
