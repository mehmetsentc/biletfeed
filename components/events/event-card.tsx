import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/events/favorite-button';
import {
  type MockEvent,
  formatEventDate,
  formatPrice
} from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: MockEvent;
  variant?: 'default' | 'horizontal' | 'featured';
  className?: string;
}

export function EventCard({
  event,
  variant = 'default',
  className
}: EventCardProps) {
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/etkinlik/${event.slug}`}
        className={cn(
          'group flex gap-4 overflow-hidden rounded-2xl border bg-card p-3 transition-all hover:shadow-lg',
          className
        )}
      >
        <div className="relative size-28 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="112px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Badge variant="secondary" className="mb-1 w-fit text-xs">
            {event.category}
          </Badge>
          <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-primary">
            {event.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatEventDate(event.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {event.city}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">
            {formatPrice(event)}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/etkinlik/${event.slug}`}
        className={cn(
          'group relative block overflow-hidden rounded-3xl',
          className
        )}
      >
        <div className="relative aspect-[4/5]">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <Badge className="mb-3 bg-white/20 text-white backdrop-blur-sm">
              {event.category}
            </Badge>
            <h3 className="text-xl font-bold leading-tight">{event.title}</h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {formatEventDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {event.city}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold">{formatPrice(event)}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[10px] border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10',
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
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          />
          {event.discountPercent && event.discountPercent > 0 && (
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
              %{event.discountPercent} indirim
            </Badge>
          )}
          {event.isFree && !event.discountPercent && (
            <Badge className="absolute left-3 top-3 bg-emerald-500 text-white">
              Ücretsiz
            </Badge>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {event.category}
            </Badge>
            <span className="text-sm font-bold text-primary">
              {formatPrice(event)}
            </span>
          </div>
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
            {event.title}
          </h3>
          <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0" />
              {formatEventDate(event.startDate)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {event.venue}, {event.city}
            </span>
          </div>
          <Button className="mt-4 w-full" size="sm">
            Bilet Al
          </Button>
        </div>
      </Link>
      <FavoriteButton className="absolute right-3 top-3 z-10" eventId={event.id} />
    </div>
  );
}
