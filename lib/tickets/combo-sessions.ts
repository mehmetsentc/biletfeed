import { parseEventSeriesMeta } from '@/lib/organizator/event-series-meta';
import { isComboTicketName } from '@/lib/tickets/purchase-types';
import { formatTurkeyDateLong } from '@/lib/datetime/istanbul';

export type ComboDayTarget = {
  eventId: string;
  startDate: Date;
  title: string;
};

type SeriesEventDb = {
  event: {
    findFirst: (args: {
      where: { id: string; deletedAt: null };
      select: { id: true; title: true; startDate: true; seo: true };
    }) => Promise<{
      id: string;
      title: string;
      startDate: Date;
      seo: unknown;
    } | null>;
    findMany: (args: {
      where: {
        deletedAt: null;
        seo: { path: ['seriesId']; equals: string };
      };
      select: { id: true; title: true; startDate: true };
      orderBy: { startDate: 'asc' };
    }) => Promise<Array<{ id: string; title: string; startDate: Date }>>;
  };
};

export function isComboSeriesTicket(
  ticketTypeName: string,
  sessionCount: number
): boolean {
  return isComboTicketName(ticketTypeName) && sessionCount >= 2;
}

/**
 * Satın alım başına QR: masa/loca kişi sayısı kadar aynı etkinlik.
 * Kombine + çok seans: yine tek (veya kişi kadar) QR — günler check-in ile ayrılır.
 */
export function comboIssueTargets(params: {
  ticketTypeName: string;
  seatsPerUnit: number;
  sessions: ComboDayTarget[];
  fallback: ComboDayTarget;
}): ComboDayTarget[] {
  const seats = Math.max(1, params.seatsPerUnit);
  return Array.from({ length: seats }, () => params.fallback);
}

export function comboAllowsGateEvent(params: {
  ticketEventId: string;
  gateEventId: string;
  sessionEventIds: string[];
  isComboSeries: boolean;
  /** Eski kombine: siparişte her gün ayrı PurchasedTicket */
  isLegacyPerDayTickets: boolean;
}): boolean {
  if (params.ticketEventId === params.gateEventId) return true;
  if (!params.isComboSeries || params.isLegacyPerDayTickets) return false;
  const ids = new Set(params.sessionEventIds);
  return ids.has(params.ticketEventId) && ids.has(params.gateEventId);
}

export function comboTicketFullyUsed(params: {
  sessionEventIds: string[];
  validCheckInEventIds: string[];
}): boolean {
  if (params.sessionEventIds.length === 0) return false;
  const used = new Set(params.validCheckInEventIds);
  return params.sessionEventIds.every((id) => used.has(id));
}

export function comboDayAttendeeLabel(
  name: string,
  target: ComboDayTarget,
  isComboSeries: boolean,
  extra?: string
): string {
  const day = isComboSeries ? ` · ${formatTurkeyDateLong(target.startDate)}` : '';
  const suffix = extra ? ` ${extra}` : '';
  return `${name.trim()}${day}${suffix}`.trim();
}

/**
 * Davetiye URL’si tarandığında hangi QR’ın işaretleneceği.
 * Eski kombine: kapı gününün biletini döner (USED olsa bile).
 * Yeni kombine: siparişte tek bilet varsa onu kullanır (gün check-in ile ayrılır).
 */
export function pickComboTicketForGate<
  T extends { eventId: string; status: string }
>(tickets: T[], scopedEventId?: string): T | undefined {
  if (tickets.length === 0) return undefined;
  if (scopedEventId) {
    const exact = tickets.find((ticket) => ticket.eventId === scopedEventId);
    if (exact) return exact;
    const uniqueEvents = new Set(tickets.map((ticket) => ticket.eventId));
    if (uniqueEvents.size === 1) return tickets[0];
    return undefined;
  }
  return tickets.find((ticket) => ticket.status === 'VALID') ?? tickets[0];
}

export function isLegacyPerDayComboTickets(
  tickets: Array<{ eventId: string }>
): boolean {
  return new Set(tickets.map((ticket) => ticket.eventId)).size >= 2;
}

export async function loadSeriesSessionTargets(
  db: SeriesEventDb,
  eventId: string
): Promise<ComboDayTarget[]> {
  const event = await db.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: { id: true, title: true, startDate: true, seo: true }
  });
  if (!event) return [];

  const series = parseEventSeriesMeta(event.seo);
  if (!series) return [];

  const rows = await db.event.findMany({
    where: {
      deletedAt: null,
      seo: { path: ['seriesId'], equals: series.seriesId }
    },
    select: { id: true, title: true, startDate: true },
    orderBy: { startDate: 'asc' }
  });

  return rows.map((row) => ({
    eventId: row.id,
    startDate: row.startDate,
    title: row.title
  }));
}
