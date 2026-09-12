'use client';

import { MapPin } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import { formatDayBadge } from '@/components/deneme/hot-tickets/mock-data';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type DayCardCarouselProps = {
  events: HotTicketEvent[];
  onOpenEvent: (event: HotTicketEvent) => void;
};

export function DayCardCarousel({ events, onOpenEvent }: DayCardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const multi = events.length > 1;

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !multi) return;
    const slide = el.clientWidth;
    if (slide <= 0) return;
    const next = Math.round(el.scrollLeft / slide);
    setIndex(Math.max(0, Math.min(events.length - 1, next)));
  }, [events.length, multi]);

  if (events.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={syncIndex}
        className={`flex w-full ${
          multi
            ? 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden'
            : ''
        }`}
      >
        {events.map((event) => {
          const badge = formatDayBadge(event.date);
          return (
            <div
              key={event.id}
              className={multi ? 'w-full shrink-0 snap-center px-0.5' : 'w-full'}
            >
              <button
                type="button"
                onClick={() => onOpenEvent(event)}
                className="relative block w-full overflow-hidden rounded-[26px] text-left shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04] transition-transform duration-200 active:scale-[0.992]"
              >
                <div className="relative h-[min(52dvh,420px)] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.coverImage}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold tracking-wide text-zinc-800 shadow-sm">
                    {badge.day} {badge.weekday}
                  </span>
                  {multi ? (
                    <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur-sm">
                      {index + 1}/{events.length}
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[21px] font-bold leading-tight tracking-tight text-white">
                      {event.title}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-white/90">
                      <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
                      <span className="truncate">{event.venue}</span>
                    </p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {multi ? (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {events.map((event, i) => (
            <button
              key={event.id}
              type="button"
              aria-label={`Etkinlik ${i + 1}`}
              onClick={() => {
                const el = scrollerRef.current;
                if (!el) return;
                el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                setIndex(i);
              }}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: i === index ? 18 : 6,
                backgroundColor: i === index ? T.accent : '#d4d4d8'
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
