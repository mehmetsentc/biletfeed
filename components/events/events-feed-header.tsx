'use client';

import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedCategoryPill =
  | 'all'
  | 'konser'
  | 'festival'
  | 'parti'
  | 'sergi'
  | 'tiyatro'
  | 'diger';

const PILLS: { id: FeedCategoryPill; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'konser', label: 'Konser' },
  { id: 'festival', label: 'Festival' },
  { id: 'parti', label: 'Parti' },
  { id: 'sergi', label: 'Sergi' },
  { id: 'tiyatro', label: 'Tiyatro' },
  { id: 'diger', label: 'Diğer' }
];

interface EventsFeedHeaderProps {
  cityLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  activePill: FeedCategoryPill;
  onPillChange: (pill: FeedCategoryPill) => void;
  resultCount: number;
  onOpenFilters?: () => void;
  sortSelect?: React.ReactNode;
}

export function EventsFeedHeader({
  cityLabel,
  searchValue,
  onSearchChange,
  activePill,
  onPillChange,
  resultCount,
  onOpenFilters,
  sortSelect
}: EventsFeedHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-[#0c1017]">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="size-7 text-primary" aria-hidden />
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Etkinlikler
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-white/50 md:text-base">
              {cityLabel} – Yaklaşan etkinlikler
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sortSelect}
            {onOpenFilters && (
              <button
                type="button"
                onClick={onOpenFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 md:hidden"
                aria-label="Gelişmiş filtreler"
              >
                <SlidersHorizontal className="size-4" />
                Filtre
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Şehir veya etkinlik ara…"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#151b24] pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            aria-label="Etkinlik ara"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PILLS.map((pill) => {
            const active = activePill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onPillChange(pill.id)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-white text-[#0c1017]'
                    : 'border border-white/15 bg-transparent text-white/75 hover:border-white/25 hover:text-white'
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-white/40">{resultCount} etkinlik</p>
      </div>
    </header>
  );
}

export function matchesFeedCategoryPill(
  event: { categorySlug: string; eventType: string; tags: string[] },
  pill: FeedCategoryPill
): boolean {
  if (pill === 'all') return true;

  const isKonser =
    event.categorySlug === 'muzik' || event.eventType === 'concert';
  const isFestival =
    event.categorySlug === 'festival' || event.eventType === 'festival';
  const isParti =
    event.tags.some((tag) => /parti|club|gece|dj/i.test(tag));
  const isSergi =
    event.categorySlug === 'sanat' || event.eventType === 'workshop';
  const isTiyatro =
    event.categorySlug === 'tiyatro' || event.eventType === 'theatre';

  switch (pill) {
    case 'konser':
      return isKonser;
    case 'festival':
      return isFestival;
    case 'parti':
      return isParti;
    case 'sergi':
      return isSergi;
    case 'tiyatro':
      return isTiyatro;
    case 'diger':
      return !(isKonser || isFestival || isParti || isSergi || isTiyatro);
    default:
      return true;
  }
}
