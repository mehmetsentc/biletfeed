import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { mockEventJoyEvents } from '@/lib/data/mock-eventjoy';
import { cn } from '@/lib/utils';

export default function EventJoyEventsPage() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-0 lg:py-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Etkinliklerim
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planladığınız tüm etkinlikler
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mockEventJoyEvents.map((event) => (
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
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  {event.confirmedCount}/{event.guestCount} onaylı
                </p>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
