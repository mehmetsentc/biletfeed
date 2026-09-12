'use client';

import { MapPin } from 'lucide-react';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import { formatDayBadge } from '@/components/deneme/hot-tickets/mock-data';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type EventCardProps = {
  event: HotTicketEvent;
  platform: HotTicketsPlatform;
  onOpen: (event: HotTicketEvent) => void;
  /** Aynı gün içindeki sıra (mobil carousel) */
  indexLabel?: string;
  focused?: boolean;
};

const HEIGHT: Record<HotTicketsPlatform, string> = {
  mobile: 'h-[min(52dvh,420px)]',
  tablet: 'h-[280px]',
  web: 'h-[260px]',
  tv: 'h-[340px]'
};

const RADIUS: Record<HotTicketsPlatform, string> = {
  mobile: 'rounded-[26px]',
  tablet: 'rounded-[22px]',
  web: 'rounded-2xl',
  tv: 'rounded-3xl'
};

const TITLE: Record<HotTicketsPlatform, string> = {
  mobile: 'text-[21px]',
  tablet: 'text-[18px]',
  web: 'text-[17px]',
  tv: 'text-[28px]'
};

export function EventCard({
  event,
  platform,
  onOpen,
  indexLabel,
  focused
}: EventCardProps) {
  const badge = formatDayBadge(event.date);
  const isTv = platform === 'tv';

  return (
    <button
      type="button"
      data-ht-card={event.id}
      onClick={() => onOpen(event)}
      className={`group relative block w-full overflow-hidden text-left transition duration-200 ${RADIUS[platform]} ${
        isTv
          ? 'ring-4 ring-transparent focus-visible:outline-none'
          : 'shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04] active:scale-[0.992]'
      } ${focused ? 'scale-[1.02]' : ''}`}
      style={
        focused || isTv
          ? {
              boxShadow: focused
                ? `0 0 0 4px ${T.accent}, 0 16px 40px ${T.glow}`
                : undefined
            }
          : undefined
      }
    >
      <div className={`relative w-full ${HEIGHT[platform]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.coverImage}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <span
          className={`absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-bold tracking-wide text-zinc-800 shadow-sm ${
            isTv ? 'text-sm' : 'text-[10px]'
          }`}
        >
          {badge.day} {badge.weekday}
        </span>

        {indexLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur-sm">
            {indexLabel}
          </span>
        ) : null}

        <div className={`absolute inset-x-0 bottom-0 ${isTv ? 'p-7' : 'p-4'}`}>
          <p
            className={`font-bold leading-tight tracking-tight text-white ${TITLE[platform]}`}
          >
            {event.title}
          </p>
          <p
            className={`mt-1.5 flex items-center gap-1.5 font-medium text-white/90 ${
              isTv ? 'text-base' : 'text-[12px]'
            }`}
          >
            <MapPin className={isTv ? 'size-4' : 'size-3.5'} strokeWidth={2} />
            <span className="truncate">{event.venue}</span>
          </p>
          {platform !== 'mobile' ? (
            <p
              className="mt-2 font-bold"
              style={{ color: T.accent }}
            >
              {event.priceLabel}
              <span className="ml-2 font-medium text-white/70">{event.time}</span>
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
