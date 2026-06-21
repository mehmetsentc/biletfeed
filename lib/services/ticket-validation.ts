import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { verifyValidationToken, parseQrPayload } from '@/lib/tickets/sign';
import { canManageEventTickets } from '@/lib/auth/organizer-api';

export type TicketValidationResult =
  | { status: 'valid'; ticket: TicketSummary; message: string }
  | { status: 'already_used'; ticket: TicketSummary; message: string }
  | { status: 'invalid'; message: string }
  | { status: 'cancelled'; message: string };

export interface TicketSummary {
  id: string;
  code: string;
  eventTitle: string;
  ticketType: string;
  holderName: string;
  scannedAt: string | null;
}

function toSummary(ticket: {
  id: string;
  ticketCode: string;
  scannedAt: Date | null;
  event: { title: string };
  ticketType: { name: string };
  user: { displayName: string };
}): TicketSummary {
  return {
    id: ticket.id,
    code: ticket.ticketCode,
    eventTitle: ticket.event.title,
    ticketType: ticket.ticketType.name,
    holderName: ticket.user.displayName,
    scannedAt: ticket.scannedAt?.toISOString() ?? null
  };
}

export async function validateTicketInput(input: {
  ticketCode?: string;
  validationToken?: string;
  ticketId?: string;
  qrRaw?: string;
  scannerUid: string;
  scannerRole?: string;
  markUsed?: boolean;
}): Promise<TicketValidationResult> {
  await ensureDbConnection();

  const parsed = input.qrRaw ? parseQrPayload(input.qrRaw) : {};
  const ticketCode = input.ticketCode || parsed.ticketCode;
  const validationToken = input.validationToken || parsed.validationToken;
  const ticketId = input.ticketId || parsed.ticketId;

  if (!ticketCode && !ticketId) {
    return { status: 'invalid', message: 'Geçersiz QR kodu' };
  }

  const ticket = await prisma.purchasedTicket.findFirst({
    where: {
      deletedAt: null,
      ...(ticketId ? { id: ticketId } : { ticketCode: ticketCode! })
    },
    include: {
      event: { select: { id: true, title: true, listingType: true } },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true } }
    }
  });

  if (!ticket) {
    return { status: 'invalid', message: 'Bilet bulunamadı' };
  }

  if (validationToken && !verifyValidationToken(ticket.id, ticket.eventId, validationToken)) {
    return { status: 'invalid', message: 'Bilet doğrulanamadı' };
  }

  const canScan = await canManageEventTickets(
    input.scannerUid,
    ticket.eventId,
    input.scannerRole
  );
  if (!canScan) {
    return { status: 'invalid', message: 'Bu bilet için yetkiniz yok' };
  }

  if (ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') {
    return { status: 'cancelled', message: 'Bilet iptal edilmiş' };
  }

  const summary = toSummary(ticket);

  if (ticket.status === 'USED' || ticket.scannedAt) {
    return {
      status: 'already_used',
      ticket: summary,
      message: 'Bilet daha önce kullanılmış'
    };
  }

  if (input.markUsed !== false) {
    await prisma.purchasedTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        scannedAt: new Date(),
        scannedBy: input.scannerUid
      }
    });
  }

  return {
    status: 'valid',
    ticket: summary,
    message: 'Bilet geçerli — giriş onaylandı'
  };
}
