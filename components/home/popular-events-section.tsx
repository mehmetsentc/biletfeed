'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EventifyCard } from '@/components/events/eventify-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MockEvent } from '@/lib/data/mock-events';

const filters = [
  { id: 'all', label: 'Tümü' },
  { id: 'today', label: 'Bugün' },
  { id: 'tomorrow', label: 'Yarın' },
  { id: 'weekend', label: 'Bu Hafta Sonu' },
  { id: 'free', label: 'Ücretsiz' }
] as const;

type FilterId = (typeof filters)[number]['id'];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isThisWeekend(date: Date, now: Date) {
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  return isSameDay(eventDay, saturday) || isSameDay(eventDay, sunday);
}

function filterEvents(events: MockEvent[], filter: FilterId): MockEvent[] {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  switch (filter) {
    case 'today':
      return events.filter((e) => isSameDay(new Date(e.startDate), now));
    case 'tomorrow':
      return events.filter((e) => isSameDay(new Date(e.startDate), tomorrow));
    case 'weekend':
      return events.filter((e) => isThisWeekend(new Date(e.startDate), now));
    case 'free':
      return events.filter((e) => e.isFree || e.price === 0);
    default:
      return events;
  }
}

interface PopularEventsSectionProps {
  events: MockEvent[];
  cityName?: string;
  citySlug?: string;
}

export function PopularEventsSection({
  events,
  cityName = 'İstanbul',
  citySlug = 'istanbul'
}: PopularEventsSectionProps) {
  const [active, setActive] = useState<FilterId>('all');
  const filtered = useMemo(() => filterEvents(events, active), [events, active]);
  const display = filtered.slice(0, 6);

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold md:text-3xl">
          {cityName}&apos;da Popüler Etkinlikler
        </h2>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                active === f.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {display.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {display.map((event) => (
              <EventifyCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-muted-foreground">
            Bu filtreye uygun etkinlik bulunamadı.
          </p>
        )}

        <div className="mt-10 flex justify-center">
          <Link href={`/etkinlikler?sehir=${citySlug}`}>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] rounded-md border-foreground/20 px-12 font-semibold"
            >
              Daha Fazla
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
