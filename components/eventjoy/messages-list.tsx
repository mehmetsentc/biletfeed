'use client';

import Link from 'next/link';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { useEventJoy } from '@/components/providers/eventjoy-provider';

export function EventJoyMessagesList() {
  const { ready, events } = useEventJoy();

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted mx-4" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Etkinlik gruplarınızdaki sohbetler
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <MessageCircle className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-semibold text-foreground">Henüz mesaj yok</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Etkinlik oluşturduğunuzda grup sohbeti burada görünür.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/eventjoy/mesajlar/${event.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/50"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {event.title.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {event.guests.length > 0
                      ? `${event.guests.length} misafir · Grup sohbeti`
                      : 'Misafir ekleyerek sohbeti başlatın'}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
