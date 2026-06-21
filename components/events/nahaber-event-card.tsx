import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventMonthDay,
  type MockEvent
} from '@/lib/data/mock-events';
import {
  getEventTicketUrl,
  getExternalPlatformLabel,
  getTicketButtonShortLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import { cn } from '@/lib/utils';

const categoryBadgeClass: Record<string, string> = {
  tiyatro: 'bg-violet-600',
  muzik: 'bg-rose-600',
  festival: 'bg-purple-600',
  sanat: 'bg-blue-600',
  spor: 'bg-emerald-600',
  teknoloji: 'bg-slate-600',
  yemek: 'bg-amber-600',
  online: 'bg-cyan-600'
};

function getCategoryBadgeClass(slug: string): string {
  return categoryBadgeClass[slug] ?? 'bg-indigo-600';
}

export function NahaberEventCard({ event }: { event: MockEvent }) {
  const { day, month } = formatEventMonthDay(event.startDate);
  const ticketUrl = getEventTicketUrl(event);
  const external = isExternalListing(event);
  const platformLabel = getExternalPlatformLabel(event.externalPlatform);
  const locationLine = `${event.venue} – ${event.city}`;

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-[#151b24] shadow-lg shadow-black/25 transition hover:border-white/20">
      <p className="truncate px-4 pt-4 text-sm text-white/55">{locationLine}</p>

      <Link
        href={`/etkinlik/${event.slug}`}
        className="group relative mx-4 mt-3 block aspect-[16/10] overflow-hidden rounded-lg"
      >
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="absolute left-2.5 top-2.5 min-w-[3rem] rounded-md bg-black/75 px-2 py-1 text-center backdrop-blur-sm">
          <div className="text-lg font-bold leading-none text-white">{day}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            {month}
          </div>
        </div>

        <span
          className={cn(
            'absolute right-2.5 top-2.5 rounded-md px-2.5 py-1 text-xs font-semibold text-white shadow-sm',
            getCategoryBadgeClass(event.categorySlug)
          )}
        >
          {event.category}
        </span>

        {(platformLabel || !external) && (
          <span className="absolute bottom-2.5 left-2.5 rounded bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-black">
            {platformLabel ?? 'Bilet Feed'}
          </span>
        )}
      </Link>

      <div className="p-4 pt-3">
        <p className="text-sm text-white/45">
          {formatEventDate(event.startDate)}, {formatEventTimeRange(event)}
        </p>

        <Link href={`/etkinlik/${event.slug}`}>
          <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-white transition hover:text-primary">
            {event.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/65">
          {event.shortDescription || event.description}
        </p>

        <p className="mt-2 truncate text-sm text-white/45">{locationLine}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-sm text-white/80">
            {event.city}
          </span>

          {external ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              {getTicketButtonShortLabel(event)}
              <ExternalLink className="size-3.5 opacity-80" />
            </a>
          ) : (
            <Link
              href={ticketUrl}
              className="inline-flex shrink-0 items-center rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              {getTicketButtonShortLabel(event)}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
