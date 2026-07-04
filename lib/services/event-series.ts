import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { parseEventSeriesMeta } from '@/lib/organizator/event-series-meta';

export interface EventSeriesSession {
  id: string;
  slug: string;
  title: string;
  startDate: Date;
  endDate: Date;
  sessionIndex: number;
  isCurrent: boolean;
}

export async function getEventSeriesSessions(
  eventId: string,
  seo: unknown
): Promise<EventSeriesSession[]> {
  const series = parseEventSeriesMeta(seo);
  if (!series) return [];

  await ensureDbConnection();

  const rows = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: { in: ['published', 'completed'] },
      seo: {
        path: ['seriesId'],
        equals: series.seriesId
      }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      startDate: true,
      endDate: true,
      seo: true
    },
    orderBy: { startDate: 'asc' }
  });

  return rows.map((row) => {
    const rowSeries = parseEventSeriesMeta(row.seo);
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      startDate: row.startDate,
      endDate: row.endDate,
      sessionIndex: rowSeries?.sessionIndex ?? 0,
      isCurrent: row.id === eventId
    };
  });
}

export async function getEventSeriesSessionsBySlug(
  slug: string
): Promise<EventSeriesSession[]> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, seo: true }
  });

  if (!event) return [];

  return getEventSeriesSessions(event.id, event.seo);
}

export async function getOrganizerEventSeriesForWizard(
  organizerId: string,
  eventId: string,
  seo: unknown
): Promise<
  Array<{
    eventId: string;
    startDate: Date;
    endDate: Date;
  }>
> {
  await ensureDbConnection();

  const series = parseEventSeriesMeta(seo);
  if (!series) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true, startDate: true, endDate: true }
    });
    return event
      ? [{ eventId: event.id, startDate: event.startDate, endDate: event.endDate }]
      : [];
  }

  const rows = await prisma.event.findMany({
    where: {
      organizerId,
      deletedAt: null,
      seo: {
        path: ['seriesId'],
        equals: series.seriesId
      }
    },
    select: {
      id: true,
      startDate: true,
      endDate: true
    },
    orderBy: { startDate: 'asc' }
  });

  return rows.map((row) => ({
    eventId: row.id,
    startDate: row.startDate,
    endDate: row.endDate
  }));
}
