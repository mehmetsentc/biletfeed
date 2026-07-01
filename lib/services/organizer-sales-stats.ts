import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { isLocaTicketType } from '@/lib/services/ticket-type-category';

export type OrganizerSalesStats = {
  ticketsSold: number;
  locaSold: number;
  invitationsSent: number;
  ticketRevenue: number;
  locaRevenue: number;
  totalRevenue: number;
  updatedAt: string;
};

export async function getOrganizerSalesStats(
  organizerId: string,
  eventId?: string
): Promise<OrganizerSalesStats> {
  await ensureDbConnection();

  const eventFilter = eventId ? { eventId } : {};

  const [orderItems, invitationsSent] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        order: {
          organizerId,
          status: 'paid',
          paymentProvider: { not: 'invitation' },
          deletedAt: null,
          ...eventFilter
        }
      },
      select: {
        quantity: true,
        unitPrice: true,
        ticketType: { select: { type: true, name: true } }
      }
    }),
    prisma.eventInvitation.count({
      where: {
        organizerId,
        deletedAt: null,
        ...eventFilter
      }
    })
  ]);

  let ticketsSold = 0;
  let locaSold = 0;
  let ticketRevenue = 0;
  let locaRevenue = 0;

  for (const item of orderItems) {
    const lineTotal = item.unitPrice * item.quantity;
    if (isLocaTicketType(item.ticketType.type, item.ticketType.name)) {
      locaSold += item.quantity;
      locaRevenue += lineTotal;
    } else {
      ticketsSold += item.quantity;
      ticketRevenue += lineTotal;
    }
  }

  return {
    ticketsSold,
    locaSold,
    invitationsSent,
    ticketRevenue,
    locaRevenue,
    totalRevenue: ticketRevenue + locaRevenue,
    updatedAt: new Date().toISOString()
  };
}
