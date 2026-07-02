import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getCouponLabelMap } from '@/lib/services/coupons';
import {
  buildCsv,
  buildOrderSummaryRow,
  buildTicketDetailRow,
  ORDER_SUMMARY_HEADERS,
  TICKET_DETAIL_HEADERS,
  ticketCsvInclude
} from '@/lib/export/csv';

/** Etkinlik bazlı satış raporu (CSV) */
export async function exportEventSalesCsv(
  organizerId: string,
  eventId: string
): Promise<string | null> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { title: true }
  });
  if (!event) return null;

  const [orders, tickets, couponLabelMap] = await Promise.all([
    prisma.order.findMany({
      where: { eventId, status: 'paid', deletedAt: null },
      orderBy: { paidAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } },
        items: { include: { ticketType: { select: { name: true } } } }
      }
    }),
    prisma.purchasedTicket.findMany({
      where: { eventId, deletedAt: null },
      include: ticketCsvInclude,
      orderBy: { createdAt: 'desc' }
    }),
    getCouponLabelMap(organizerId, eventId)
  ]);

  const rows: string[][] = [
    [...ORDER_SUMMARY_HEADERS],
    ...orders.map((order) => buildOrderSummaryRow(order, couponLabelMap)),
    [],
    [...TICKET_DETAIL_HEADERS],
    ...tickets.map((ticket) => buildTicketDetailRow(ticket, false, couponLabelMap))
  ];

  return buildCsv(rows);
}
