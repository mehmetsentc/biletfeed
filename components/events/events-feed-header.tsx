'use client';

import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedCategoryPill =
  | 'all'
  | 'konser'
  | 'party'
  | 'festival'
  | 'tiyatro'
  | 'standup'
  | 'spor'
  | 'cocuk'
  | 'elektronik'
  | 'workshop'
  | 'diger';

const PILLS: { id: FeedCategoryPill; label: string }[] = [
  { id: 'all',       label: 'Tümü' },
  { id: 'konser',    label: 'Konser' },
  { id: 'party',     label: 'Party' },
  { id: 'festival',  label: 'Festival' },
  { id: 'tiyatro',   label: 'Tiyatro' },
  { id: 'standup',   label: 'Stand Up' },
  { id: 'spor',      label: 'Spor' },
  { id: 'cocuk',     label: 'Çocuk' },
  { id: 'elektronik',label: 'Elektronik Müzik' },
  { id: 'workshop',  label: 'Workshop' },
  { id: 'diger',     label: 'Diğer' },
];

interface EventsFeedHeaderProps {
  cityLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  activePill: FeedCategoryPill;
  onPillChange: (pill: FeedCategoryPill) => void;
  resultCount: number;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
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
  activeFilterCount = 0,
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
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
                aria-label="Gelişmiş filtreler"
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Filtre</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
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

        <div className="mt-5 flex gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-white/10">
          {PILLS.map((pill) => {
            const active = activePill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onPillChange(pill.id)}
                className={cn(
                  'shrink-0 px-4 pb-3 pt-1 text-xs font-bold uppercase tracking-wide transition whitespace-nowrap border-b-2',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white/50 hover:text-white/80'
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

  const slug = event.categorySlug;
  const type = event.eventType;
  const tags = event.tags.join(' ').toLowerCase();

  switch (pill) {
    case 'konser':
      return slug === 'muzik' || type === 'concert';
    case 'tiyatro':
      return slug === 'tiyatro' || type === 'theatre';
    case 'festival':
      return slug === 'festival' || type === 'festival';
    case 'elektronik':
      return /elektronik|techno|house|edm|dj/i.test(tags) ||
             (slug === 'muzik' && /elektronik|techno|house|edm|dj/i.test(event.eventType));
    case 'standup':
      return /stand.?up|komedi|comedy/i.test(tags) || slug === 'komedi';
    case 'cocuk':
      return /çocuk|cocuk|kids|aile|family/i.test(tags) || slug === 'cocuk';
    case 'spor':
      return slug === 'spor' || type === 'sport';
    case 'workshop':
      return slug === 'workshop' || type === 'workshop' ||
             /workshop|atölye|atolye|eğitim|egitim/i.test(tags);
    case 'party':
      return slug === 'party' || /party|parti|gece|rave|dj.set/i.test(tags);
    case 'diger':
      return slug === 'diger' || slug === 'online' || slug === 'yemek' || slug === 'yemek-icecek' || slug === 'sanat' || slug === 'teknoloji';
    default:
      return true;
  }
}
