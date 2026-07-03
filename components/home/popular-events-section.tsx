'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EventifyCard } from '@/components/events/eventify-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MockEvent } from '@/lib/data/mock-events';
import { isUpcomingEvent } from '@/lib/events/upcoming';

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
  const upcoming = events.filter((event) => isUpcomingEvent(event, now));
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  switch (filter) {
    case 'today':
      return upcoming.filter((e) => isSameDay(new Date(e.startDate), now));
    case 'tomorrow':
      return upcoming.filter((e) => isSameDay(new Date(e.startDate), tomorrow));
    case 'weekend':
      return upcoming.filter((e) => isThisWeekend(new Date(e.startDate), now));
    case 'free':
      return upcoming.filter((e) => e.isFree || e.price === 0);
    default:
      return upcoming;
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
    <section className="bg-background py-14 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {cityName}&apos;da Popüler Etkinlikler
        </h2>

        <div className="mt-7 flex flex-wrap gap-2.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
                active === f.id
                  ? '-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-[var(--shadow-sm)]'
                  : 'border-border/80 bg-card/80 text-foreground shadow-[var(--shadow-xs)] backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-sm)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {display.length > 0 ? (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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
