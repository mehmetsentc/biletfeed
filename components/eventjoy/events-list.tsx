'use client';

import Link from 'next/link';
import { Calendar, CalendarPlus, ChevronRight } from 'lucide-react';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { cn } from '@/lib/utils';

export function EventJoyEventsList() {
  const { ready, events } = useEventJoy();

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4 px-4 py-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Etkinliklerim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length > 0
              ? 'Planladığınız tüm etkinlikler'
              : 'Henüz etkinlik eklemediniz'}
          </p>
        </div>
        <Link
          href="/eventjoy/yeni"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <CalendarPlus className="size-4" />
          Yeni Etkinlik
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Calendar className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-semibold text-foreground">Etkinlik bulunamadı</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Davetiye oluşturmak için yeni bir etkinlik ekleyin.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventjoy/etkinlik/${event.id}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <div className={cn('h-1.5 bg-gradient-to-r', event.coverColor)} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {event.type}
                    </p>
                    <p className="mt-1 font-bold text-foreground group-hover:text-primary">
                      {event.title}
                    </p>
                  </div>
                  <Calendar className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long'
                  })}{' '}
                  · {event.time}
                </p>
                {event.location && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {event.location}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {event.confirmedCount}/
                    {event.guestCount || event.guests.length} onaylı
                  </p>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
