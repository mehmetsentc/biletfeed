import type { Event, TicketType, Category, City, Venue } from '@prisma/client';

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
  description: string;
  coverImage: string | null;
  ticketType: 'free' | 'paid';
  location: 'venue' | 'online' | 'hybrid';
  sessions: Array<{
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
  eventRules: string;
}

function toLocalDateParts(value: Date | string): { date: string; time: string } {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

function splitTicketLabel(name: string, description: string): { name: string; description: string } {
  if (description.trim()) {
    return { name, description };
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

export function mapEventToWizardInitialData(event: EventWithRelations): EventWizardInitialData {
  const start = toLocalDateParts(event.startDate);
  const end = toLocalDateParts(event.endDate);
  const venueName = event.venue?.name ?? '';
  const isOnline = venueName.toLowerCase() === 'online';

  return {
    title: event.title,
    category: event.category.slug,
    citySlug: event.city.slug,
    venueName: isOnline ? '' : venueName,
    description: event.description,
    coverImage: event.coverImage || null,
    ticketType: event.isFree ? 'free' : 'paid',
    location: isOnline ? 'online' : 'venue',
    sessions: [
      {
        startDate: start.date,
        endDate: end.date,
        startTime: start.time,
        endTime: end.time
      }
    ],
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
    eventRules: event.rules?.trim() ?? ''
  };
}
