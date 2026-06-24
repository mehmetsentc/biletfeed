import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function scheduleOrganizerPayout(params: {
  orderId: string;
  organizerId: string;
  eventId: string;
  grossAmount: number;
  commissionAmount: number;
  currency?: 'TRY' | 'USD' | 'EUR';
}) {
  const existing = await prisma.organizerPayout.findFirst({
    where: { orderId: params.orderId }
  });
  if (existing) return existing;

  const netAmount =
    Math.round((params.grossAmount - params.commissionAmount) * 100) / 100;

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { endDate: true }
  });

  const payout = await prisma.organizerPayout.create({
    data: {
      orderId: params.orderId,
      organizerId: params.organizerId,
      eventId: params.eventId,
      grossAmount: params.grossAmount,
      commissionAmount: params.commissionAmount,
      netAmount,
      currency: params.currency ?? 'TRY',
      status: 'scheduled',
      scheduledAt: event?.endDate ?? new Date()
    }
  });

  await logAccountingAudit({
    action: 'payout.scheduled',
    entityType: 'organizer_payout',
    entityId: payout.id,
    after: { netAmount, scheduledAt: payout.scheduledAt }
  });

  return payout;
}
