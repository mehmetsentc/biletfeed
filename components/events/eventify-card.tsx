import Image from 'next/image';
import Link from 'next/link';
import { Star, Tag } from 'lucide-react';
import { FavoriteButton } from '@/components/events/favorite-button';
import {
  type MockEvent,
  formatEventMonthDay,
  formatEventTimeRange,
  formatPrice
} from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

interface EventifyCardProps {
  event: MockEvent;
  countryBadge?: string;
  className?: string;
  isFavorite?: boolean;
}

export function EventifyCard({
  event,
  countryBadge,
  className,
  isFavorite = false
}: EventifyCardProps) {
  const { month, day } = formatEventMonthDay(event.startDate);
  const interested = Math.max(12, Math.floor(event.attendees * 0.08));

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <Link href={`/etkinlik/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          {countryBadge && (
            <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {countryBadge}
            </span>
          )}
          <span className="absolute bottom-3 left-3 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
            {event.category}
          </span>
          <FavoriteButton
            className="absolute right-3 top-3 z-10 !bg-white !text-foreground"
            icon="star"
            eventId={event.id}
            initialActive={isFavorite}
          />
        </div>

        <div className="flex gap-4 p-4">
          <div className="flex w-14 shrink-0 flex-col items-center border-r pr-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {month}
            </span>
            <span className="text-2xl font-extrabold leading-none">{day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-primary">
              {event.title}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {event.isOnline || event.citySlug === 'online' ? 'Online' : `${event.venue}, ${event.city}`}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatEventTimeRange(event)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                <Tag className="size-3" />
                {formatPrice(event)}
              </span>
              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <Star className="size-3" />
                {interested} ilgi
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
