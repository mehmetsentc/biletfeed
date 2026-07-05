import Image from 'next/image';
import Link from 'next/link';
import type { MockEvent } from '@/lib/data/mock-events';
import {
  formatEventCountdown,
  formatMobileEventDateLine
} from '@/lib/events/mobile-event-date';
import { cn } from '@/lib/utils';

type HomeEventScrollCardProps = {
  event: MockEvent;
  className?: string;
};

export function HomeEventScrollCard({ event, className }: HomeEventScrollCardProps) {
  const location =
    event.isOnline || event.citySlug === 'online'
      ? 'Online'
      : `${event.city}${event.venue ? `, ${event.venue.split(',')[0]}` : ''}`;

  return (
    <Link
      href={`/etkinlik/${event.slug}`}
      className={cn(
        'group flex w-[9.5rem] shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-sm)] ring-1 ring-border/60 transition-transform duration-200 active:scale-[0.98] sm:w-[10.5rem]',
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="168px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
          {event.title}
        </h3>
        <p className="text-xs font-semibold capitalize text-primary">
          {formatMobileEventDateLine(event.startDate)}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{location}</p>
        <p className="mt-auto pt-1 text-[11px] font-medium text-muted-foreground/80">
          {formatEventCountdown(event.startDate)}
        </p>
      </div>
    </Link>
  );
}
