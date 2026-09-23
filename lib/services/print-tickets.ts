import { randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { findOrCreateGuestUser } from '@/lib/services/guest-user';
import { formatTurkeyDate, formatTurkeyTime } from '@/lib/datetime/istanbul';
import {
  buildTicketQrPayload,
  generateTicketCode,
  generateValidationToken
} from '@/lib/tickets/sign';
import { asSeatPlan, requiresSeatAssignment } from '@/lib/tickets/seat-inventory';
import { isComboTicketName } from '@/lib/tickets/purchase-types';
import {
  PRINT_PAYMENT_PROVIDER,
  PRINT_TICKET_MAX,
  formatPrintAttendeeName,
  formatPrintSequence,
  formatPrintSerial,
  sequenceFromPrintAttendee
} from '@/lib/tickets/print/constants';
import type { PrintSheetTicket } from '@/lib/tickets/pdf/generate-print-sheet';
import { partnerMarksForEventTitle } from '@/lib/tickets/print/partner-marks';

export class PrintTicketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrintTicketError';
  }
}

export type PrintTicketBatchSummary = {
  orderId: string;
  quantity: number;
  ticketTypeName: string;
  createdAt: string;
};

function printHolderEmail(organizerId: string): string {
  return `print-stock+${organizerId}@biletfeed.local`;
}

function formatPrintDateTime(value: Date): string {
  const date = formatTurkeyDate(value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return `${date} ${formatTurkeyTime(value)}`;
}

function pdfFilename(slug: string, quantity: number): string {
  const safe =
    slug
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'etkinlik';
  return `BiletFeed-baski-${safe}-${quantity}.pdf`;
}

function uniqueTicketCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(generateTicketCode());
  return [...codes];
}

export async function listPrintTicketBatches(
  organizerId: string,
  eventId: string
): Promise<PrintTicketBatchSummary[]> {
  await ensureDbConnection();

  const orders = await prisma.order.findMany({
    where: {
      organizerId,
      eventId,
      paymentProvider: PRINT_PAYMENT_PROVIDER,
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      items: {
        include: { ticketType: { select: { name: true } } }
      }
    }
  });

  return orders.map((order) => ({
    orderId: order.id,
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    ticketTypeName: order.items[0]?.ticketType.name ?? 'Bilet',
    createdAt: order.createdAt.toISOString()
  }));
}

export async function createPrintTicketBatch(params: {
  organizerId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
}): Promise<PrintTicketBatchSummary> {
  await ensureDbConnection();

  const quantity = params.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > PRINT_TICKET_MAX) {
    throw new PrintTicketError(`Bilet adedi 1 ile ${PRINT_TICKET_MAX} arasında olmalı`);
  }

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, organizerId: params.organizerId, deletedAt: null },
    include: {
      venue: { select: { seatPlan: true } },
      ticketTypes: {
        where: { id: params.ticketTypeId, deletedAt: null }
      }
    }
  });

  if (!event) throw new PrintTicketError('Etkinlik bulunamadı');
  if (event.status === 'cancelled' || event.status === 'completed') {
    throw new PrintTicketError('İptal edilmiş veya tamamlanmış etkinlik için baskı bileti üretilemez');
  }

  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new PrintTicketError('Bilet türü bulunamadı');
  if (ticketType.invitationOnly) {
    throw new PrintTicketError('Davetiye kontenjanı baskı bileti için kullanılamaz');
  }
  if (isComboTicketName(ticketType.name)) {
    throw new PrintTicketError('Kombine bilet türü için baskı partisi üretilemez');
  }
  if ((ticketType.seatsPerUnit ?? 1) > 1) {
    throw new PrintTicketError(
      'Bu bilet türü birden fazla kişilik paket. Baskı için kişi başı genel giriş türü seçin'
    );
  }
  if (requiresSeatAssignment(asSeatPlan(event.venue?.seatPlan))) {
    throw new PrintTicketError(
      'Koltuk planı olan etkinliklerde baskı bileti üretilemez. Genel giriş etkinlikleri için kullanın'
    );
  }

  const capacity = ticketType.capacity || ticketType.quantity;
  const remaining = capacity - ticketType.sold;
  if (quantity > remaining) {
    throw new PrintTicketError(
      remaining > 0
        ? `Kontenjan yetersiz. Bu türde en fazla ${remaining} baskı bileti üretilebilir`
        : 'Bu bilet türünde kontenjan kalmadı'
    );
  }

  const holder = await findOrCreateGuestUser('Baskı Bileti', printHolderEmail(params.organizerId));
  const orderId = randomUUID();
  const codes = uniqueTicketCodes(quantity);
  const ticketRows = codes.map((ticketCode, index) => {
    const id = randomUUID();
    const sequence = index + 1;
    return {
      id,
      orderId,
      ticketTypeId: ticketType.id,
      userId: holder.id,
      eventId: event.id,
      ticketCode,
      validationToken: generateValidationToken(id, event.id),
      status: 'VALID' as const,
      attendeeName: formatPrintAttendeeName(sequence)
    };
  });

  await prisma.$transaction(
    async (tx) => {
      const reserved = await tx.ticketType.updateMany({
        where: {
          id: ticketType.id,
          eventId: event.id,
          deletedAt: null,
          sold: { lte: capacity - quantity }
        },
        data: { sold: { increment: quantity } }
      });
      if (reserved.count !== 1) {
        throw new PrintTicketError('Kontenjan yetersiz veya bilet türü değişti. Adedi düşürüp yeniden deneyin');
      }

      await tx.order.create({
        data: {
          id: orderId,
          userId: holder.id,
          eventId: event.id,
          organizerId: params.organizerId,
          subtotal: 0,
          discount: 0,
          commission: 0,
          total: 0,
          status: 'paid',
          paymentProvider: PRINT_PAYMENT_PROVIDER,
          paymentId: `print_${orderId}`,
          paidAt: new Date(),
          attendeeName: 'Baskı partisi',
          items: {
            create: {
              ticketTypeId: ticketType.id,
              quantity,
              unitPrice: 0
            }
          }
        }
      });

      await tx.purchasedTicket.createMany({ data: ticketRows });
    },
    { timeout: 20_000 }
  );

  return {
    orderId,
    quantity,
    ticketTypeName: ticketType.name,
    createdAt: new Date().toISOString()
  };
}

export async function loadPrintSheetForOrder(
  organizerId: string,
  eventId: string,
  orderId: string
): Promise<{ filename: string; tickets: PrintSheetTicket[] } | null> {
  await ensureDbConnection();

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      eventId,
      organizerId,
      paymentProvider: PRINT_PAYMENT_PROVIDER,
      deletedAt: null
    },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startDate: true,
          city: { select: { name: true } },
          venue: { select: { name: true, address: true } }
        }
      },
      items: {
        include: { ticketType: { select: { name: true } } }
      },
      purchasedTickets: {
        where: { deletedAt: null, status: { in: ['VALID', 'USED'] } },
        select: {
          id: true,
          ticketCode: true,
          validationToken: true,
          attendeeName: true,
          createdAt: true
        }
      }
    }
  });

  if (!order) return null;

  const venueName = order.event.venue?.name || order.event.city.name;
  const addressLine = [order.event.venue?.address, order.event.city.name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(', ');
  const ticketTypeName = order.items[0]?.ticketType.name ?? 'Genel Giriş';
  const dateTimeLabel = formatPrintDateTime(order.event.startDate);

  const tickets = [...order.purchasedTickets].sort((a, b) => {
    const aSeq = sequenceFromPrintAttendee(a.attendeeName) ?? Number.MAX_SAFE_INTEGER;
    const bSeq = sequenceFromPrintAttendee(b.attendeeName) ?? Number.MAX_SAFE_INTEGER;
    if (aSeq !== bSeq) return aSeq - bSeq;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return {
    filename: pdfFilename(order.event.slug, tickets.length),
    tickets: tickets.map((ticket, index) => {
      const sequence = sequenceFromPrintAttendee(ticket.attendeeName) ?? index + 1;
      return {
        eventTitle: order.event.title,
        ticketTypeName,
        dateTimeLabel,
        venueName,
        addressLine: addressLine || venueName,
        ticketCode: ticket.ticketCode,
        serial: formatPrintSerial(order.id, sequence),
        sequenceLabel: formatPrintSequence(sequence),
        partners: partnerMarksForEventTitle(order.event.title) ?? undefined,
        qrData: buildTicketQrPayload({
          ticketId: ticket.id,
          ticketCode: ticket.ticketCode,
          validationToken: ticket.validationToken
        })
      };
    })
  };
}
