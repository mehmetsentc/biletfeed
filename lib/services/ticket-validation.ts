import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { verifyValidationToken, parseQrPayload } from '@/lib/tickets/sign';
import { canManageEventTickets } from '@/lib/auth/organizer-api';
import type { EntryPolicy } from '@prisma/client';

export type TicketValidationStatus =
  | 'VALID'
  | 'USED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'INVALID';

export interface TicketSummary {
  id: string;
  code: string;
  eventTitle: string;
  ticketType: string;
  holderName: string;
  scannedAt: string | null;
  entryCount: number;
}

export type TicketValidationResult = {
  status: TicketValidationStatus;
  message: string;
  ticket?: TicketSummary;
};

function toSummary(ticket: {
  id: string;
  ticketCode: string;
  scannedAt: Date | null;
  entryCount: number;
  attendeeName: string | null;
  event: { title: string };
  ticketType: { name: string };
  user: { displayName: string };
}): TicketSummary {
  return {
    id: ticket.id,
    code: ticket.ticketCode,
    eventTitle: ticket.event.title,
    ticketType: ticket.ticketType.name,
    holderName: ticket.attendeeName?.trim() || ticket.user.displayName,
    scannedAt: ticket.scannedAt?.toISOString() ?? null,
    entryCount: ticket.entryCount
  };
}

async function logCheckIn(params: {
  ticketId: string;
  eventId: string;
  checkedBy: string;
  result: TicketValidationStatus;
  device?: string;
  ipAddress?: string;
  scannerId?: string;
}): Promise<void> {
  await prisma.ticketCheckIn.create({
    data: {
      ticketId: params.ticketId,
      eventId: params.eventId,
      checkedBy: params.checkedBy,
      device: params.device ?? null,
      ipAddress: params.ipAddress ?? null,
      scannerId: params.scannerId ?? null,
      result: params.result
    }
  });
}

function isEventExpired(endDate: Date): boolean {
  return endDate.getTime() < Date.now();
}

function entryBlocked(
  policy: EntryPolicy,
  entryCount: number,
  status: string
): boolean {
  if (policy === 'single') {
    return status === 'USED' || entryCount > 0;
  }
  return false;
}

export async function validateTicketInput(input: {
  ticketCode?: string;
  validationToken?: string;
  ticketId?: string;
  qrRaw?: string;
  eventId?: string;
  scannerUid: string;
  scannerRole?: string;
  markUsed?: boolean;
  device?: string;
  ipAddress?: string;
  scannerId?: string;
}): Promise<TicketValidationResult> {
  await ensureDbConnection();

  const parsed = input.qrRaw ? parseQrPayload(input.qrRaw) : {};
  const ticketCode = input.ticketCode || parsed.ticketCode;
  const validationToken = input.validationToken || parsed.validationToken;
  const ticketId = input.ticketId || parsed.ticketId;

  if (!ticketCode && !ticketId) {
    return { status: 'INVALID', message: 'Geçersiz QR kodu' };
  }

  const ticket = await prisma.purchasedTicket.findFirst({
    where: {
      deletedAt: null,
      ...(ticketId ? { id: ticketId } : { ticketCode: ticketCode! })
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          listingType: true,
          endDate: true,
          entryPolicy: true
        }
      },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true } }
    }
  });

  if (!ticket) {
    return { status: 'INVALID', message: 'Bilet bulunamadı' };
  }

  if (input.eventId && ticket.eventId !== input.eventId) {
    return {
      status: 'INVALID',
      message: 'Bu bilet seçili etkinliğe ait değil',
      ticket: toSummary(ticket),
    };
  }

  const canScan = await canManageEventTickets(
    input.scannerUid,
    ticket.eventId,
    input.scannerRole
  );
  if (!canScan) {
    return { status: 'INVALID', message: 'Bu bilet için yetkiniz yok' };
  }

  if (validationToken) {
    if (
      !verifyValidationToken(
        ticket.id,
        ticket.eventId,
        validationToken,
        ticket.tokenNonce
      )
    ) {
      return { status: 'INVALID', message: 'Bilet doğrulanamadı' };
    }
  } else if (!ticketCode) {
    return { status: 'INVALID', message: 'Geçersiz QR kodu' };
  }
  // Organizatör manuel BF kodu: token yok ama yetki doğrulandı — kapı girişi

  const summary = toSummary(ticket);
  const policy = ticket.event.entryPolicy;

  if (ticket.status === 'REFUNDED') {
    await logCheckIn({
      ticketId: ticket.id,
      eventId: ticket.eventId,
      checkedBy: input.scannerUid,
      result: 'REFUNDED',
      device: input.device,
      ipAddress: input.ipAddress,
      scannerId: input.scannerId
    });
    return { status: 'REFUNDED', message: 'Bilet iade edilmiş', ticket: summary };
  }

  if (ticket.status === 'CANCELLED') {
    await logCheckIn({
      ticketId: ticket.id,
      eventId: ticket.eventId,
      checkedBy: input.scannerUid,
      result: 'CANCELLED',
      device: input.device,
      ipAddress: input.ipAddress,
      scannerId: input.scannerId
    });
    return { status: 'CANCELLED', message: 'Bilet iptal edilmiş', ticket: summary };
  }

  if (isEventExpired(ticket.event.endDate) && policy !== 'unlimited') {
    await logCheckIn({
      ticketId: ticket.id,
      eventId: ticket.eventId,
      checkedBy: input.scannerUid,
      result: 'EXPIRED',
      device: input.device,
      ipAddress: input.ipAddress,
      scannerId: input.scannerId
    });
    return { status: 'EXPIRED', message: 'Etkinlik süresi dolmuş', ticket: summary };
  }

  if (entryBlocked(policy, ticket.entryCount, ticket.status)) {
    await logCheckIn({
      ticketId: ticket.id,
      eventId: ticket.eventId,
      checkedBy: input.scannerUid,
      result: 'USED',
      device: input.device,
      ipAddress: input.ipAddress,
      scannerId: input.scannerId
    });
    return {
      status: 'USED',
      message: 'Bilet daha önce kullanılmış',
      ticket: summary
    };
  }

  if (input.markUsed === false) {
    return {
      status: 'VALID',
      message: 'Bilet geçerli',
      ticket: summary
    };
  }

  const now = new Date();
  const nextEntryCount = ticket.entryCount + 1;
  const markAsUsed = policy === 'single';

  await prisma.purchasedTicket.update({
    where: { id: ticket.id },
    data: {
      entryCount: nextEntryCount,
      scannedAt: ticket.scannedAt ?? now,
      scannedBy: input.scannerUid,
      ...(markAsUsed ? { status: 'USED' } : {})
    }
  });

  await logCheckIn({
    ticketId: ticket.id,
    eventId: ticket.eventId,
    checkedBy: input.scannerUid,
    result: 'VALID',
    device: input.device,
    ipAddress: input.ipAddress,
    scannerId: input.scannerId
  });

  const entryLabel =
    policy === 'single'
      ? 'Giriş onaylandı'
      : `Giriş onaylandı (${nextEntryCount}. giriş)`;

  return {
    status: 'VALID',
    ticket: { ...summary, entryCount: nextEntryCount, scannedAt: now.toISOString() },
    message: entryLabel
  };
}

export async function incrementTicketDownload(ticketId: string): Promise<void> {
  await ensureDbConnection();
  await prisma.purchasedTicket.update({
    where: { id: ticketId },
    data: { downloadCount: { increment: 1 } }
  });
}
