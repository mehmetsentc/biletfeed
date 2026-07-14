import type { Event, TicketType, Category, City, Venue } from '@prisma/client';

import type { EventAnnouncementInput, EventRuleSetData } from '@/lib/event-rules/types';
import { parsePerformersFromSeo } from '@/lib/organizator/event-metadata';

type EventWithRelations = Event & {
  category: Category;
  city: City;
  venue: Venue | null;
  ticketTypes: TicketType[];
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
  performers: Array<{
    name: string;
    type: 'person' | 'group';
  }>;
  eventRules: string;
  ruleSet: EventRuleSetData & { announcements: EventAnnouncementInput[] };
}

function toLocalDateParts(value: Date | string): { date: string; time: string } {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
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
    performers: parsePerformersFromSeo(event.seo),
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
