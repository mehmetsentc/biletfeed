import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { FavoriteButton } from '@/components/events/favorite-button';
import {
  type MockEvent,
  formatEventDateLine,
  formatPrice
} from '@/lib/data/mock-events';

interface EventMobileCardProps {
  event: MockEvent;
}

export function EventMobileCard({ event }: EventMobileCardProps) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Favori butonu Link'in DIŞINDA */}
      <FavoriteButton
        className="absolute right-3 top-3 z-20 !bg-card/90 !text-foreground shadow-md hover:!bg-card"
        icon="star"
        eventId={event.id}
      />
      <Link href={`/etkinlik/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <span className="absolute bottom-3 left-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-primary-foreground">
            {event.category}
          </span>
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold text-[var(--bf-accent-ink)]">
            {formatEventDateLine(event)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug">
            {event.title}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {event.isOnline ? 'Online' : `${event.venue}, ${event.city}`}
            </span>
          </p>
          <p className="mt-3 text-sm font-bold">{formatPrice(event)}</p>
        </div>
      </Link>
    </article>
  );
}
