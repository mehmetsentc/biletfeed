import type { Event, TicketType, Category, City, Venue, Artist } from '@prisma/client';

import type { EventAnnouncementInput, EventRuleSetData } from '@/lib/event-rules/types';
import { parsePerformersFromSeo } from '@/lib/organizator/event-metadata';

type EventWithRelations = Event & {
  category: Category;
  city: City;
  venue: Venue | null;
  ticketTypes: TicketType[];
  artists?: Array<{
    artistId: string;
    role: string;
    sortOrder: number;
    artist: Pick<Artist, 'id' | 'name' | 'type' | 'image'>;
  }>;
};

export interface EventWizardInitialData {
  title: string;
  category: string;
  citySlug: string;
  venueName: string;
  venueAddress: string;
  description: string;
  coverImage: string | null;
  ticketType: 'free' | 'paid';
  location: 'venue' | 'online' | 'hybrid';
  eventTypeMode: 'single' | 'recurring';
  sessions: Array<{
    eventId?: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }>;
  ticketCategories: Array<{
    ticketTypeId?: string;
    name: string;
    description: string;
    price: string;
    capacity: string;
    sold: number;
    showLowStockBadge: boolean;
  }>;
  tags: string[];
  performers: Array<{
    name: string;
    type: 'person' | 'group';
    artistId?: string;
    image?: string;
    role?: string;
  }>;
  venueMapUrl?: string;
  eventRules: string;
  ruleSet: EventRuleSetData & { announcements: EventAnnouncementInput[] };
}

function toLocalDateParts(value: Date | string): { date: string; time: string } {
  const d = new Date(value);
  // DB stores UTC; convert to Turkey local time (Europe/Istanbul = UTC+3/+4)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour'); // midnight edge case
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`
  };
}

function splitTicketLabel(
  name: string,
  description: string | null | undefined
): { name: string; description: string } {
  const desc = description ?? '';
  if (desc.trim()) {
    return { name, description: desc };
  }
  const sep = ' — ';
  const idx = name.indexOf(sep);
  if (idx >= 0) {
    return {
      name: name.slice(0, idx),
      description: name.slice(idx + sep.length)
    };
  }
  return { name, description: '' };
}

export function mapEventToWizardInitialData(
  event: EventWithRelations,
  ruleSetData?: {
    ruleSet: EventRuleSetData | null;
    announcements: EventAnnouncementInput[];
  },
  seriesSessions?: Array<{
    eventId: string;
    startDate: Date;
    endDate: Date;
  }>
): EventWizardInitialData {
  const sessionSource =
    seriesSessions && seriesSessions.length > 0
      ? seriesSessions
      : [{ eventId: event.id, startDate: event.startDate, endDate: event.endDate }];

  return {
    title: event.title,
    category: event.category.slug,
    citySlug: event.city.slug,
    venueName: (() => {
      const venueName = event.venue?.name ?? '';
      const isOnline = venueName.toLowerCase() === 'online';
      return isOnline ? '' : venueName;
    })(),
    venueAddress: event.venue?.address ?? '',
    description: event.description,
    coverImage: event.coverImage || null,
    ticketType: event.isFree ? 'free' : 'paid',
    location: (() => {
      const venueName = event.venue?.name ?? '';
      return venueName.toLowerCase() === 'online' ? 'online' : 'venue';
    })(),
    eventTypeMode: sessionSource.length > 1 ? 'recurring' : 'single',
    sessions: sessionSource.map((session) => {
      const start = toLocalDateParts(session.startDate);
      const end = toLocalDateParts(session.endDate);
      return {
        eventId: session.eventId,
        startDate: start.date,
        endDate: end.date,
        startTime: start.time,
        endTime: end.time
      };
    }),
    ticketCategories: event.ticketTypes.map((ticket) => {
      const label = splitTicketLabel(ticket.name, ticket.description);
      return {
        ticketTypeId: ticket.id,
        name: label.name,
        description: label.description,
        price: String(ticket.price),
        capacity: String(ticket.capacity || ticket.quantity),
        sold: ticket.sold,
        showLowStockBadge: ticket.showLowStockBadge
      };
    }),
    tags: event.tags ?? [],
    performers: (() => {
      // Prefer EventArtist relations (from new system); fall back to seo JSON
      if (event.artists && event.artists.length > 0) {
        return [...event.artists]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((ea) => ({
            name: ea.artist.name,
            type: (ea.artist.type === 'group' ? 'group' : 'person') as 'person' | 'group',
            artistId: ea.artist.id,
            image: ea.artist.image ?? undefined,
            role: ea.role
          }));
      }
      return parsePerformersFromSeo(event.seo).map((p) => ({ ...p }));
    })(),
    venueMapUrl: (() => {
      if (!event.seo || typeof event.seo !== 'object' || Array.isArray(event.seo)) return undefined;
      const url = (event.seo as { venueMapUrl?: unknown }).venueMapUrl;
      return typeof url === 'string' && url.trim() ? url.trim() : undefined;
    })(),
    eventRules: event.rules?.trim() ?? '',
    ruleSet: {
      selectedRules: ruleSetData?.ruleSet?.selectedRules ?? [],
      customRules:
        ruleSetData?.ruleSet?.customRules ??
        (event.rules?.trim()
          ? event.rules.split(/\r?\n/).filter(Boolean)
          : []),
      appliedTemplateId: ruleSetData?.ruleSet?.appliedTemplateId ?? null,
      announcements: ruleSetData?.announcements ?? []
    }
  };
}
