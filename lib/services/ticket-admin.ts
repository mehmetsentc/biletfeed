import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getCouponLabelMap } from '@/lib/services/coupons';
import {
  entryCategoryLabel,
  resolveEntryCategory,
  resolveTicketKind
} from '@/lib/tickets/entry-display';
import {
  buildCsv,
  buildTicketDetailRow,
  TICKET_DETAIL_HEADERS_WITH_EVENT,
  ticketCsvIncludeWithEvent
} from '@/lib/export/csv';

export async function getOrganizerCheckInStats(
  organizerId: string,
  eventId?: string
) {
  await ensureDbConnection();

  const eventScope = {
    organizerId,
    ...(eventId ? { id: eventId } : {})
  };

  const [sold, checkedIn, waiting, recentCheckIns, capacity] = await Promise.all([
    prisma.purchasedTicket.count({
      where: {
        event: eventScope,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        event: eventScope,
        deletedAt: null,
        entryCount: { gt: 0 }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        event: eventScope,
        deletedAt: null,
        status: 'VALID',
        entryCount: 0
      }
    }),
    prisma.ticketCheckIn.findMany({
      where: { event: eventScope },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        ticket: {
          select: {
            ticketCode: true,
            attendeeName: true,
            user: { select: { displayName: true } },
            event: { select: { title: true } },
            ticketType: { select: { name: true, type: true } },
            invitation: { select: { id: true, guestName: true } },
            order: { select: { paymentProvider: true } }
          }
        }
      }
    }),
    prisma.event.aggregate({
      where: { organizerId, deletedAt: null, ...(eventId ? { id: eventId } : {}) },
      _sum: { capacity: true }
    })
  ]);

  const totalCapacity = capacity._sum.capacity ?? sold;
  const attendancePct =
    sold > 0 ? Math.round((checkedIn / sold) * 100) : 0;

  return {
    sold,
    checkedIn,
    waiting,
    totalCapacity,
    attendancePct,
    recentCheckIns: recentCheckIns.map((row) => {
      const isInvitation =
        Boolean(row.ticket.invitation) || row.ticket.order.paymentProvider === 'invitation';
      const entryCategory = resolveEntryCategory(
        row.ticket.ticketType.type,
        row.ticket.ticketType.name
      );
      return {
        id: row.id,
        result: row.result,
        createdAt: row.createdAt,
        ticketCode: row.ticket.ticketCode,
        holderName:
          row.ticket.invitation?.guestName?.trim() ||
          row.ticket.attendeeName?.trim() ||
          row.ticket.user.displayName,
        eventTitle: row.ticket.event.title,
        ticketKind: resolveTicketKind(isInvitation),
        categoryLabel: entryCategoryLabel(entryCategory, row.ticket.ticketType.name),
        entryCategory
      };
    })
  };
}

export async function exportOrganizerTicketsCsv(
  organizerId: string,
  eventId?: string
): Promise<string> {
  await ensureDbConnection();

  const [tickets, couponLabelMap] = await Promise.all([
    prisma.purchasedTicket.findMany({
      where: {
        event: { organizerId },
        deletedAt: null,
        ...(eventId ? { eventId } : {})
      },
      include: ticketCsvIncludeWithEvent,
      orderBy: { createdAt: 'desc' }
    }),
    getCouponLabelMap(organizerId, eventId)
  ]);

  const rows: string[][] = [
    [...TICKET_DETAIL_HEADERS_WITH_EVENT],
    ...tickets.map((ticket) => buildTicketDetailRow(ticket, true, couponLabelMap))
  ];

  return buildCsv(rows);
}

export async function searchAdminTickets(query: string, limit = 50) {
  await ensureDbConnection();
  const q = query.trim();
  if (!q) return [];

  return prisma.purchasedTicket.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ticketCode: { contains: q, mode: 'insensitive' } },
        { attendeeName: { contains: q, mode: 'insensitive' } },
        { attendeeEmail: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { displayName: { contains: q, mode: 'insensitive' } } },
        { validationToken: q }
      ]
    },
    include: {
      event: { select: { title: true } },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
