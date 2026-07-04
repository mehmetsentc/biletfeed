import type { MockEvent } from '@/lib/data/mock-events';

export type EventSortOption =
  | 'relevance'
  | 'date-asc'
  | 'date-desc'
  | 'price-asc'
  | 'price-desc';

function compareStartDateAsc(a: MockEvent, b: MockEvent): number {
  return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
}

function compareRelevance(a: MockEvent, b: MockEvent): number {
  if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
  if (a.attendees !== b.attendees) return b.attendees - a.attendees;

  const favA = a.favoriteCount ?? 0;
  const favB = b.favoriteCount ?? 0;
  if (favA !== favB) return favB - favA;

  return compareStartDateAsc(a, b);
}

export function sortEvents(
  events: MockEvent[],
  sort: EventSortOption
): MockEvent[] {
  const sorted = [...events];
  switch (sort) {
    case 'date-asc':
      return sorted.sort(compareStartDateAsc);
    case 'date-desc':
      return sorted.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'relevance':
    default:
      return sorted.sort(compareRelevance);
  }
}
