import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { brandTheme } from '@/lib/config/brand-theme';
import { formatEventDate } from '@/lib/data/mock-events';
import type { MockEvent } from '@/lib/data/mock-events';

type BfCheckoutContextBarProps = {
  event: MockEvent;
  backHref?: string;
};

export function BfCheckoutContextBar({
  event,
  backHref
}: BfCheckoutContextBarProps) {
  const back = backHref ?? `/etkinlik/${event.slug}`;

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] text-white">
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-primary sm:w-20"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        aria-hidden
      />
      <div className="container mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:gap-5 sm:py-5">
        <Link
          href={back}
          className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          aria-label="Geri"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 sm:size-16">
          <Image
            src={event.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="relative min-w-0 flex-1">
          <p className="truncate text-base font-bold sm:text-lg">{event.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/65 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0 text-primary" />
              {formatEventDate(event.startDate)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">
                {event.venue}
                {event.city ? `, ${event.city}` : ''}
              </span>
            </span>
          </div>
        </div>

        <div
          className="hidden shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:block"
          style={{
            backgroundColor: brandTheme.orangeSoft,
            color: brandTheme.orangeHover
          }}
        >
          BiletFeed
        </div>
      </div>
    </div>
  );
}
