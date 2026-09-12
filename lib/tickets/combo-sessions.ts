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

/**
 * Kombine + tekrarlayan seans: her gün ayrı bilet.
 * Masa/loca veya tek seans: seatsPerUnit kadar aynı etkinlik QR'ı.
 */
export function comboIssueTargets(params: {
  ticketTypeName: string;
  seatsPerUnit: number;
  sessions: ComboDayTarget[];
  fallback: ComboDayTarget;
}): ComboDayTarget[] {
  const seats = Math.max(1, params.seatsPerUnit);
  if (isComboTicketName(params.ticketTypeName) && params.sessions.length >= 2) {
    return params.sessions;
  }
  return Array.from({ length: seats }, () => params.fallback);
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
 * Kapı belirli bir güne kilitliyse o günün biletini döner (USED olsa bile),
 * böylece 4 Ekim bileti 3 Ekim kapısında tüketilmez.
 */
export function pickComboTicketForGate<
  T extends { eventId: string; status: string }
>(tickets: T[], scopedEventId?: string): T | undefined {
  if (tickets.length === 0) return undefined;
  if (scopedEventId) {
    return tickets.find((ticket) => ticket.eventId === scopedEventId);
  }
  return tickets.find((ticket) => ticket.status === 'VALID') ?? tickets[0];
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
