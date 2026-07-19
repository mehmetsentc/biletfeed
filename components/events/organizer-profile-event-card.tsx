import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  type MockEvent,
  formatEventDate,
  formatPrice
} from '@/lib/data/mock-events';
import type { EventStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<'draft' | 'pending' | 'published', string> = {
  draft: 'Taslak',
  pending: 'Onay Bekliyor',
  published: 'Yayında'
};

const STATUS_STYLES: Record<'draft' | 'pending' | 'published', string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-50 text-amber-800',
  published: 'bg-emerald-50 text-emerald-700'
};

interface OrganizerProfileEventCardProps {
  event: MockEvent;
  isOwner: boolean;
  className?: string;
}

function statusBadge(status: EventStatus | undefined) {
  if (!status || status === 'published') return null;
  const key = status as keyof typeof STATUS_LABELS;
  if (!(key in STATUS_LABELS)) return null;
  return (
    <Badge className={cn('absolute left-3 top-3 z-10 text-xs', STATUS_STYLES[key])}>
      {STATUS_LABELS[key]}
    </Badge>
  );
}

export function OrganizerProfileEventCard({
  event,
  isOwner,
  className
}: OrganizerProfileEventCardProps) {
  const href = `/etkinlik/${event.slug}`;

  return (
    <div className={cn('group relative', className)}>
      <Link
        href={href}
        className="block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {statusBadge(event.status)}
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
        <div className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs">
            {event.category}
          </Badge>
          <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-[var(--bf-accent-ink)]">
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
          <p className="mt-2 text-sm font-semibold text-[var(--bf-accent-ink)]">
            {formatPrice(event)}
          </p>
        </div>
      </Link>
      {isOwner && event.status !== 'published' && (
        <Link
          href={`/organizator-panel/etkinlik/${event.id}/duzenle`}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-[var(--bf-accent-ink)]"
          aria-label="Düzenle"
        >
          <Pencil className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
