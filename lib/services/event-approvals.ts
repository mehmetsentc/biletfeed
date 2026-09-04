import type { EventStatus } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { sendEventApprovedEmail } from '@/lib/email/send-event-approved-email';
import { parseEventSeriesMeta } from '@/lib/organizator/event-series-meta';

async function findPendingSeriesEventIds(eventId: string): Promise<string[]> {
  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      listingType: 'internal',
      status: 'pending'
    },
    select: { id: true, seo: true }
  });

  if (!existing) return [];

  const series = parseEventSeriesMeta(existing.seo);
  if (!series?.seriesId) return [existing.id];

  const siblings = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: 'internal',
      status: 'pending',
      seo: { path: ['seriesId'], equals: series.seriesId }
    },
    select: { id: true }
  });

  return siblings.length > 0 ? siblings.map((s) => s.id) : [existing.id];
}

export async function listPendingInternalEvents() {
  await ensureDbConnection();
  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: 'internal',
      status: 'pending'
    },
    include: {
      ...eventInclude,
      organizer: { include: { owner: { select: { email: true, displayName: true } } } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Tekrarlayan serilerde onay listesinde tek satır göster (onay tüm seansları yayınlar)
  const seenSeries = new Set<string>();
  const deduped = events.filter((event) => {
    const series = parseEventSeriesMeta(event.seo);
    if (!series?.seriesId) return true;
    if (seenSeries.has(series.seriesId)) return false;
    seenSeries.add(series.seriesId);
    return true;
  });

  return deduped.map((event) => {
    const series = parseEventSeriesMeta(event.seo);
    const mock = toMockEvent(event);
    return {
      ...mock,
      title:
        series && series.sessionCount > 1
          ? `${mock.title} (${series.sessionCount} seans)`
          : mock.title,
      createdAt: event.createdAt.toISOString(),
      organizerEmail: event.organizer.owner.email,
      organizerOwnerName: event.organizer.owner.displayName
    };
  });
}

export async function approveInternalEvent(eventId: string) {
  await ensureDbConnection();

  const ids = await findPendingSeriesEventIds(eventId);
  if (ids.length === 0) {
    throw new Error('Onay bekleyen etkinlik bulunamadı');
  }

  await prisma.event.updateMany({
    where: { id: { in: ids }, status: 'pending', deletedAt: null },
    data: {
      status: 'published' satisfies EventStatus,
      approvedAt: new Date()
    }
  });

  // E-posta ve dönüş için tıklanan (veya serinin ilk) kaydı kullan
  const event = await prisma.event.findFirstOrThrow({
    where: { id: { in: ids } },
    include: eventInclude,
    orderBy: { startDate: 'asc' }
  });

  await Promise.all(ids.map((id) => sendEventApprovedEmail(id).catch(() => undefined)));

  return toMockEvent(event);
}

export async function rejectInternalEvent(eventId: string) {
  await ensureDbConnection();

  const ids = await findPendingSeriesEventIds(eventId);
  if (ids.length === 0) {
    throw new Error('Onay bekleyen etkinlik bulunamadı');
  }

  await prisma.event.updateMany({
    where: { id: { in: ids }, status: 'pending', deletedAt: null },
    data: { status: 'draft' satisfies EventStatus }
  });

  const event = await prisma.event.findFirstOrThrow({
    where: { id: { in: ids } },
    include: eventInclude,
    orderBy: { startDate: 'asc' }
  });

  return toMockEvent(event);
}

export const approveEvent = approveInternalEvent;
export const rejectEvent = rejectInternalEvent;
