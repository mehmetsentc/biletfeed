import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { rotateValidationToken } from '@/lib/tickets/sign';
import { sendTicketPurchaseEmail } from '@/lib/email/send-ticket-purchase-email';
import { validateTicketInput } from '@/lib/services/ticket-validation';

export async function adminForceCheckIn(ticketId: string, adminUid: string) {
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, deletedAt: null },
    select: { ticketCode: true, validationToken: true, id: true }
  });
  if (!ticket) throw new Error('Bilet bulunamadı');

  return validateTicketInput({
    ticketCode: ticket.ticketCode,
    validationToken: ticket.validationToken,
    ticketId: ticket.id,
    scannerUid: adminUid,
    scannerRole: 'ROLE_ADMIN',
    markUsed: true
  });
}

export async function adminCancelTicket(ticketId: string): Promise<void> {
  await ensureDbConnection();
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, deletedAt: null, status: 'VALID' }
  });
  if (!ticket) throw new Error('İptal edilebilir bilet bulunamadı');

  await prisma.purchasedTicket.update({
    where: { id: ticketId },
    data: { status: 'CANCELLED' }
  });
}

export async function adminRegenerateQr(ticketId: string): Promise<{ ticketCode: string }> {
  await ensureDbConnection();
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, deletedAt: null },
    select: { id: true, eventId: true, ticketCode: true }
  });
  if (!ticket) throw new Error('Bilet bulunamadı');

  const { token, nonce } = rotateValidationToken(ticket.id, ticket.eventId);
  await prisma.purchasedTicket.update({
    where: { id: ticketId },
    data: { validationToken: token, tokenNonce: nonce }
  });

  return { ticketCode: ticket.ticketCode };
}

export async function organizerResendTicketEmail(
  ticketId: string,
  organizerId: string
): Promise<void> {
  await ensureDbConnection();
  const ticket = await prisma.purchasedTicket.findFirst({
    where: {
      id: ticketId,
      deletedAt: null,
      event: { organizerId }
    },
    select: { orderId: true }
  });
  if (!ticket) throw new Error('Bilet bulunamadı');

  await sendTicketPurchaseEmail(ticket.orderId, { force: true });
}

export async function organizerManualCheckIn(
  ticketId: string,
  organizerUid: string,
  scannerId?: string
) {
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, deletedAt: null },
    select: { ticketCode: true, id: true }
  });
  if (!ticket) throw new Error('Bilet bulunamadı');

  return validateTicketInput({
    ticketCode: ticket.ticketCode,
    ticketId: ticket.id,
    scannerUid: organizerUid,
    scannerRole: 'ROLE_ORGANIZER',
    markUsed: true,
    scannerId
  });
}

export async function requestWalletPass(
  ticketId: string,
  userId: string,
  platform: 'apple' | 'google'
): Promise<{ status: string; message: string }> {
  await ensureDbConnection();
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: ticketId, userId, deletedAt: null, status: { in: ['VALID', 'USED'] } }
  });
  if (!ticket) throw new Error('Bilet bulunamadı');

  await prisma.walletPass.upsert({
    where: { ticketId_platform: { ticketId, platform } },
    create: { ticketId, platform, status: 'pending' },
    update: { status: 'pending', updatedAt: new Date() }
  });

  return {
    status: 'pending',
    message:
      platform === 'apple'
        ? 'Apple Wallet entegrasyonu yakında aktif olacak. Biletiniz kaydedildi.'
        : 'Google Wallet entegrasyonu yakında aktif olacak. Biletiniz kaydedildi.'
  };
}
