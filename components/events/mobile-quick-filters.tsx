'use client';

import { cn } from '@/lib/utils';
import type {
  DateFilter,
  EventsFilters,
  FormatFilter,
  PriceFilter
} from '@/components/events/events-filter-types';
import { toggleFilterItem } from '@/components/events/events-filter-utils';

type ChipDef =
  | { kind: 'price'; id: PriceFilter; label: string }
  | { kind: 'date'; id: DateFilter; label: string }
  | { kind: 'format'; id: FormatFilter; label: string };

const quickChips: ChipDef[] = [
  { kind: 'date', id: 'today', label: 'Bugün' },
  { kind: 'date', id: 'weekend', label: 'Hafta Sonu' },
  { kind: 'price', id: 'free', label: 'Ücretsiz' },
  { kind: 'format', id: 'concert', label: 'Konser' },
  { kind: 'format', id: 'online', label: 'Online' }
];

function isChipActive(filters: EventsFilters, chip: ChipDef): boolean {
  switch (chip.kind) {
    case 'price':
      return filters.price.includes(chip.id);
    case 'date':
      return filters.date.includes(chip.id);
    case 'format':
      return filters.formats.includes(chip.id);
  }
}

function toggleChip(filters: EventsFilters, chip: ChipDef): EventsFilters {
  switch (chip.kind) {
    case 'price':
      return {
        ...filters,
        price: toggleFilterItem(
          filters.price,
          chip.id,
          !filters.price.includes(chip.id)
        )
      };
    case 'date':
      return {
        ...filters,
        date: toggleFilterItem(
          filters.date,
          chip.id,
          !filters.date.includes(chip.id)
        )
      };
    case 'format':
      return {
        ...filters,
        formats: toggleFilterItem(
          filters.formats,
          chip.id,
          !filters.formats.includes(chip.id)
        )
      };
  }
}

interface MobileQuickFiltersProps {
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  className?: string;
}

export function MobileQuickFilters({
  filters,
  onChange,
  className
}: MobileQuickFiltersProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {quickChips.map((chip) => {
        const active = isChipActive(filters, chip);
        return (
          <button
            key={`${chip.kind}-${chip.id}`}
            type="button"
            onClick={() => onChange(toggleChip(filters, chip))}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
