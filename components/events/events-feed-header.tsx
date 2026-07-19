'use client';

import { CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from '@/components/providers';
import { filterPublicEventTags } from '@/lib/events/public-tags';
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

const PILL_IDS: FeedCategoryPill[] = [
  'all',
  'konser',
  'party',
  'festival',
  'tiyatro',
  'standup',
  'spor',
  'cocuk',
  'elektronik',
  'workshop',
  'diger'
];

function pillLabel(id: FeedCategoryPill, t: ReturnType<typeof useTranslations>): string {
  switch (id) {
    case 'all':
      return t.common.all;
    case 'konser':
      return t.filters.concert;
    case 'party':
      return t.categories.party;
    case 'festival':
      return t.categories.festival;
    case 'tiyatro':
      return t.categories.tiyatro;
    case 'standup':
      return t.filters.standUp;
    case 'spor':
      return t.categories.spor;
    case 'cocuk':
      return t.categories.cocuk;
    case 'elektronik':
      return t.filters.electronic;
    case 'workshop':
      return t.filters.workshop;
    case 'diger':
      return t.categories.diger;
    default:
      return id;
  }
}

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
  const t = useTranslations();

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="size-7 text-[var(--bf-accent-ink)]" aria-hidden />
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t.events.title}
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
              {t.events.upcomingIn(cityLabel)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {sortSelect}
            {onOpenFilters && (
              <button
                type="button"
                onClick={onOpenFilters}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted"
                aria-label={t.filters.advanced}
              >
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">{t.common.filter}</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-5 hidden md:block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.events.searchPlaceholder}
            className="h-12 w-full rounded-xl border border-border bg-muted pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            aria-label={t.nav.search}
          />
        </div>

        <div className="mt-5 flex gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border">
          {PILL_IDS.map((pillId) => {
            const active = activePill === pillId;
            return (
              <button
                key={pillId}
                type="button"
                onClick={() => onPillChange(pillId)}
                className={cn(
                  'shrink-0 px-4 pb-3 pt-1 text-xs font-bold uppercase tracking-wide transition whitespace-nowrap border-b-2',
                  active
                    ? 'border-primary text-[var(--bf-accent-ink)]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {pillLabel(pillId, t)}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {t.filters.eventCount(resultCount)}
        </p>
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
  const tags = filterPublicEventTags(event.tags).join(' ').toLowerCase();

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
