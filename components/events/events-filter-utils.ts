import type { EventsFilters } from '@/components/events/events-filter-types';

export function countActiveFilters(filters: EventsFilters): number {
  return (
    filters.price.length +
    filters.date.length +
    filters.categories.length +
    filters.formats.length +
    (filters.customDate ? 1 : 0)
  );
}

export function toggleFilterItem<T>(list: T[], item: T, checked: boolean): T[] {
  if (checked) return list.includes(item) ? list : [...list, item];
  return list.filter((i) => i !== item);
}

export function clearAllFilters(): EventsFilters {
  return {
    price: [],
    date: [],
    categories: [],
    formats: [],
    customDate: ''
  };
}
