'use client';

import { CalendarPlus, Clock } from 'lucide-react';
import {
  formatEventDateLong,
  formatEventTimeRange,
  type MockEvent
} from '@/lib/data/mock-events';

interface EventDateTimeProps {
  event: MockEvent;
}

function buildCalendarUrl(event: MockEvent): string {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.shortDescription,
    location: `${event.venue}, ${event.address}, ${event.city}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventDateTime({ event }: EventDateTimeProps) {
  return (
    <section>
      <h2 className="text-xl font-bold">Tarih ve Saat</h2>
      <div className="mt-4 space-y-2 text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarPlus className="size-4 shrink-0" strokeWidth={1.75} />
          {formatEventDateLong(event.startDate)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" strokeWidth={1.75} />
          {formatEventTimeRange(event)}
        </p>
      </div>
      <a
        href={buildCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        + Takvime Ekle
      </a>
    </section>
  );
}
