import type { EventStatus } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { sendEventApprovedEmail } from '@/lib/email/send-event-approved-email';

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

  return events.map((event) => ({
    ...toMockEvent(event),
    createdAt: event.createdAt.toISOString(),
    organizerEmail: event.organizer.owner.email,
    organizerOwnerName: event.organizer.owner.displayName
  }));
}

export async function approveInternalEvent(eventId: string) {
  await ensureDbConnection();

  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      listingType: 'internal',
      status: 'pending'
    },
    select: { id: true }
  });

  if (!existing) {
    throw new Error('Onay bekleyen etkinlik bulunamadı');
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: 'published' satisfies EventStatus },
    include: eventInclude
  });

  await sendEventApprovedEmail(eventId);

  return toMockEvent(event);
}

export async function rejectInternalEvent(eventId: string) {
  await ensureDbConnection();

  const existing = await prisma.event.findFirst({
    where: {
      id: eventId,
      deletedAt: null,
      listingType: 'internal',
      status: 'pending'
    },
    select: { id: true }
  });

  if (!existing) {
    throw new Error('Onay bekleyen etkinlik bulunamadı');
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: 'draft' satisfies EventStatus },
    include: eventInclude
  });

  return toMockEvent(event);
}

export const approveEvent = approveInternalEvent;
export const rejectEvent = rejectInternalEvent;
