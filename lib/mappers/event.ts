import type { MockEvent } from '@/lib/data/mock-events';
import { getExternalPlatformLabel } from '@/lib/events/ticket-url';

function parseFavoriteCount(stats: unknown): number {
  if (!stats || typeof stats !== 'object' || !('favorites' in stats)) return 0;
  const value = Number((stats as { favorites: unknown }).favorites);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

const eventInclude = {
  organizer: true,
  venue: true,
  city: true,
  category: true,
  ticketTypes: {
    where: { deletedAt: null },
    orderBy: { price: 'asc' as const }
  }
} as const;

export type EventWithRelations = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  coverImage: string;
  gallery: string[];
  startDate: Date;
  endDate: Date;
  eventType: string;
  isOnline: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isFree: boolean;
  discountPercent: number | null;
  basePrice: number;
  currency: string;
  attendees: number;
  capacity: number;
  tags: string[];
  organizer: { name: string; slug: string };
  venue: { name: string; address: string } | null;
  city: { name: string; slug: string };
  category: { name: string; slug: string };
  ticketTypes: { price: number }[];
  listingType?: string;
  externalPlatform?: string | null;
  externalUrl?: string | null;
  status?: string;
  stats?: unknown;
};

export function toMockEvent(event: EventWithRelations): MockEvent {
  const minPrice =
    event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : event.basePrice;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription || event.description.slice(0, 120),
    coverImage: event.coverImage,
    gallery: event.gallery,
    category: event.category.name,
    categorySlug: event.category.slug,
    eventType: event.eventType as MockEvent['eventType'],
    city: event.city.name,
    citySlug: event.city.slug,
    venue: event.venue?.name || (event.isOnline ? 'Online' : ''),
    address: event.venue?.address || '',
    organizer:
      event.listingType === 'external'
        ? getExternalPlatformLabel(event.externalPlatform) ?? event.organizer.name
        : event.organizer.name,
    organizerSlug: event.organizer.slug,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    price: minPrice,
    currency: event.currency,
    isFree: event.isFree,
    isFeatured: event.isFeatured,
    isTrending: event.isTrending,
    isOnline: event.isOnline,
    discountPercent: event.discountPercent ?? undefined,
    attendees: event.attendees,
    capacity: event.capacity,
    tags: event.tags,
    favoriteCount: parseFavoriteCount(event.stats),
    listingType: (event.listingType as MockEvent['listingType']) || 'internal',
    externalPlatform: event.externalPlatform ?? undefined,
    externalUrl: event.externalUrl ?? undefined,
    status: event.status as MockEvent['status']
  };
}

export { eventInclude };
