import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { mockEventJoyEvents } from '@/lib/data/mock-eventjoy';
import { cn } from '@/lib/utils';

export default function EventJoyEventsPage() {
  return (
    <div className="bg-white px-4 py-6">
      <h1 className="text-xl font-bold">Etkinliklerim</h1>
      <p className="mt-1 text-sm text-muted-foreground">Planladığınız tüm etkinlikler</p>

      <div className="mt-6 space-y-3">
        {mockEventJoyEvents.map((event) => (
          <Link
            key={event.id}
            href={`/eventjoy/etkinlik/${event.id}`}
            className="block overflow-hidden rounded-xl border bg-white shadow-sm transition active:scale-[0.99]"
          >
            <div className={cn('h-1.5 bg-gradient-to-r', event.coverColor)} />
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{event.type}</p>
                  <p className="font-bold">{event.title}</p>
                </div>
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long'
                })}{' '}
                · {event.time}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {event.confirmedCount}/{event.guestCount} onaylı misafir
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
