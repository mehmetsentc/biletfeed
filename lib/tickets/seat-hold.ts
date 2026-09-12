import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { extractSeatUnitId } from '@/lib/tickets/seat-label';

export function normalizeSeatUnitId(id: string): string {
  return id.trim().toUpperCase();
}

export function parseSeatsProviderRef(ref: string | null | undefined): string[] {
  if (!ref?.startsWith('seats:')) return [];
  return [
    ...new Set(
      ref
        .slice(6)
        .split(',')
        .map((s) => normalizeSeatUnitId(s))
        .filter(Boolean)
    )
  ];
}

export async function createSeatHoldsForOrder(
  tx: Prisma.TransactionClient,
  params: {
    eventId: string;
    orderId: string;
    seatUnitIds: string[];
    expiresAt: Date;
  }
): Promise<void> {
  const seats = [
    ...new Set(params.seatUnitIds.map(normalizeSeatUnitId).filter(Boolean))
  ];
  if (seats.length === 0) return;

  try {
    await tx.seatHold.createMany({
      data: seats.map((seatUnitId) => ({
        id: randomUUID(),
        eventId: params.eventId,
        orderId: params.orderId,
        seatUnitId,
        expiresAt: params.expiresAt
      }))
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new Error(
        'Seçilen koltuk(lar) az önce rezerve edildi. Lütfen başka koltuk seçin.'
      );
    }
    throw err;
  }
}

export async function releaseSeatHoldsForOrders(
  tx: Prisma.TransactionClient,
  orderIds: string[]
): Promise<void> {
  if (orderIds.length === 0) return;
  await tx.seatHold.deleteMany({ where: { orderId: { in: orderIds } } });
}

export async function getHeldSeatUnitIds(eventId: string): Promise<string[]> {
  await ensureDbConnection();
  const holds = await prisma.seatHold.findMany({
    where: { eventId, expiresAt: { gt: new Date() } },
    select: { seatUnitId: true },
    take: 20000
  });
  return holds.map((h) => normalizeSeatUnitId(h.seatUnitId));
}

export async function getSoldAndHeldSeatUnitIds(eventId: string): Promise<string[]> {
  await ensureDbConnection();
  const [tickets, held] = await Promise.all([
    prisma.purchasedTicket.findMany({
      where: {
        eventId,
        status: { in: ['VALID', 'USED'] },
        deletedAt: null
      },
      select: { attendeeName: true, seatUnitId: true },
      take: 20000
    }),
    getHeldSeatUnitIds(eventId)
  ]);
  const ids = new Set<string>(held);
  for (const t of tickets) {
    const id = extractSeatUnitId({
      seatUnitId: t.seatUnitId,
      attendeeName: t.attendeeName
    });
    if (id) ids.add(normalizeSeatUnitId(id));
  }
  return [...ids];
}

export async function assertSeatFreeInTx(
  tx: Prisma.TransactionClient,
  params: {
    eventId: string;
    seatUnitId: string;
    orderId?: string;
  }
): Promise<void> {
  const seatUnitId = normalizeSeatUnitId(params.seatUnitId);
  if (!seatUnitId) return;

  const clash = await tx.purchasedTicket.findFirst({
    where: {
      eventId: params.eventId,
      deletedAt: null,
      status: { in: ['VALID', 'USED'] },
      seatUnitId: { equals: seatUnitId, mode: 'insensitive' }
    },
    select: { id: true }
  });
  if (clash) {
    throw new Error(`Koltuk ${seatUnitId} az önce satıldı`);
  }

  const hold = await tx.seatHold.findFirst({
    where: {
      eventId: params.eventId,
      seatUnitId,
      expiresAt: { gt: new Date() },
      ...(params.orderId ? { orderId: { not: params.orderId } } : {})
    },
    select: { id: true }
  });
  if (hold) {
    throw new Error(`Koltuk ${seatUnitId} şu an başka bir siparişte rezerve`);
  }
}
