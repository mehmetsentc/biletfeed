import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { verifyValidationToken, parseQrPayload, normalizeTicketCode, resolveManualScanInput } from '@/lib/tickets/sign';
import { canScannerAccessTicket } from '@/lib/auth/organizer-api';
import {
  entryCategoryLabel,
  resolveEntryCategory,
  resolveTicketKind,
  ticketTypeDisplayLabel,
  type EntryCategory,
  type EntryTicketKind
} from '@/lib/tickets/entry-display';
import { shouldRejectQrToken } from '@/lib/tickets/qr-token-policy';
import { pickComboTicketForGate } from '@/lib/tickets/combo-sessions';
import type { UserRole } from '@/types';
import type { EntryPolicy, TicketTypeEnum } from '@prisma/client';

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
  categoryLabel: string;
  entryCategory: EntryCategory;
  ticketKind: EntryTicketKind;
  holderName: string;
  scannedAt: string | null;
  entryCount: number;
  isInvitation?: boolean;
  guestEmail?: string | null;
  guestPhone?: string | null;
  inviteStatus?: string;
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
  ticketType: { name: string; type: TicketTypeEnum };
  user: { displayName: string };
  invitation?: {
    guestName: string;
    guestEmail: string | null;
    guestPhone: string | null;
    status: string;
  } | null;
}): TicketSummary {
  const isInvitation = Boolean(ticket.invitation);
  const entryCategory = resolveEntryCategory(ticket.ticketType.type, ticket.ticketType.name);
  const categoryLabel = entryCategoryLabel(entryCategory, ticket.ticketType.name);
  return {
    id: ticket.id,
    code: ticket.ticketCode,
    eventTitle: ticket.event.title,
    ticketType: ticketTypeDisplayLabel(ticket.ticketType.name),
    categoryLabel,
    entryCategory,
    ticketKind: resolveTicketKind(isInvitation),
    holderName:
      ticket.invitation?.guestName?.trim() ||
      ticket.attendeeName?.trim() ||
      ticket.user.displayName,
    scannedAt: ticket.scannedAt?.toISOString() ?? null,
    entryCount: ticket.entryCount,
    isInvitation,
    guestEmail: ticket.invitation?.guestEmail ?? null,
    guestPhone: ticket.invitation?.guestPhone ?? null,
    inviteStatus: ticket.invitation?.status
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
  gateEventId?: string;
  scannerUid: string;
  scannerEmail?: string;
  scannerRole?: UserRole;
  scannerUserId?: string;
  scannerOrganizerId?: string;
  markUsed?: boolean;
  device?: string;
  ipAddress?: string;
  scannerId?: string;
}): Promise<TicketValidationResult> {
  await ensureDbConnection();

  const parsed = input.qrRaw
    ? parseQrPayload(input.qrRaw)
    : input.ticketCode
      ? resolveManualScanInput(input.ticketCode)
      : {};
  let ticketCode = normalizeTicketCode(input.ticketCode || parsed.ticketCode);
  let validationToken = input.validationToken || parsed.validationToken;
  let ticketId = input.ticketId || parsed.ticketId;

  if (!ticketCode && !ticketId && parsed.inviteToken) {
    const invitation = await prisma.eventInvitation.findFirst({
      where: {
        inviteToken: parsed.inviteToken,
        deletedAt: null,
        status: { not: 'cancelled' }
      },
      select: {
        status: true,
        purchasedTicket: {
          select: {
            id: true,
            ticketCode: true,
            validationToken: true,
            status: true,
            orderId: true,
            eventId: true
          }
        }
      }
    });
    if (!invitation?.purchasedTicket) {
      return { status: 'INVALID', message: 'Davetiye bulunamadı veya iptal edilmiş' };
    }

    const orderTickets = await prisma.purchasedTicket.findMany({
      where: {
        orderId: invitation.purchasedTicket.orderId,
        deletedAt: null
      },
      select: {
        id: true,
        ticketCode: true,
        validationToken: true,
        status: true,
        eventId: true
      },
      orderBy: { createdAt: 'asc' }
    });
    const scopedEventId = input.gateEventId || input.eventId;
    const chosen = pickComboTicketForGate(
      orderTickets.length > 0 ? orderTickets : [invitation.purchasedTicket],
      scopedEventId
    );
    if (!chosen) {
      return {
        status: 'INVALID',
        message: scopedEventId
          ? 'Bu davetiye seçili günün kapısı için geçerli değil'
          : 'Davetiye bileti bulunamadı'
      };
    }
    if (chosen.status === 'CANCELLED' || chosen.status === 'REFUNDED') {
      return {
        status: chosen.status,
        message:
          chosen.status === 'REFUNDED'
            ? 'Bilet iade edilmiş'
            : 'Bilet iptal edilmiş'
      };
    }
    ticketId = chosen.id;
    ticketCode = chosen.ticketCode;
    validationToken = chosen.validationToken;
  }

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
          organizerId: true,
          title: true,
          listingType: true,
          endDate: true,
          entryPolicy: true
        }
      },
      ticketType: { select: { name: true, type: true } },
      user: { select: { displayName: true } },
      invitation: {
        select: {
          organizerId: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          status: true
        }
      },
      order: { select: { organizerId: true } }
    }
  });

  if (!ticket) {
    return { status: 'INVALID', message: 'Bilet bulunamadı' };
  }

  if (input.gateEventId && ticket.eventId !== input.gateEventId) {
    return {
      status: 'INVALID',
      message: 'Bu kapı kodu yalnızca tanımlı etkinlik için geçerlidir',
      ticket: toSummary(ticket)
    };
  }

  if (input.eventId && ticket.eventId !== input.eventId) {
    return {
      status: 'INVALID',
      message: 'Bu bilet seçili etkinliğe ait değil',
      ticket: toSummary(ticket),
    };
  }

  const canScan = await canScannerAccessTicket({
    ticketId: ticket.id,
    eventId: ticket.eventId,
    firebaseUid: input.scannerUid,
    email: input.scannerEmail,
    role: input.scannerRole,
    scannerUserId: input.scannerUserId,
    scannerOrganizerId: input.scannerOrganizerId,
    eventOrganizerId: ticket.event.organizerId,
    invitationOrganizerId: ticket.invitation?.organizerId,
    orderOrganizerId: ticket.order.organizerId
  });

  if (!canScan) {
    const [eventOrganizer, scannerOrganizer] = await Promise.all([
      prisma.organizer.findUnique({
        where: { id: ticket.event.organizerId },
        select: { name: true }
      }),
      input.scannerOrganizerId
        ? prisma.organizer.findUnique({
            where: { id: input.scannerOrganizerId },
            select: { name: true }
          })
        : Promise.resolve(null)
    ]);

    const eventOrgName = eventOrganizer?.name ?? 'bu organizatör';
    const scannerOrgName = scannerOrganizer?.name;

    return {
      status: 'INVALID',
      message: scannerOrgName
        ? `Bu bilet "${eventOrgName}" etkinliğine ait. Şu an "${scannerOrgName}" hesabıyla giriş yaptınız. Doğru organizatör hesabıyla panelde oturum açın.`
        : 'Bu bilet için yetkiniz yok. Panelde doğru organizatör hesabıyla giriş yaptığınızdan ve etkinliğin size ait olduğundan emin olun.'
    };
  }

  if (validationToken) {
    const tokenValid = verifyValidationToken(
      ticket.id,
      ticket.eventId,
      validationToken,
      ticket.tokenNonce
    );
    if (shouldRejectQrToken({ hasValidationToken: true, tokenValid })) {
      return { status: 'INVALID', message: 'Bilet doğrulanamadı' };
    }
  } else if (!ticketCode) {
    return { status: 'INVALID', message: 'Geçersiz QR kodu' };
  }
  // Manuel BF kodu (token yok) veya HMAC doğrulanmış QR

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
  const markAsUsed = policy === 'single';

  const claimed = await prisma.purchasedTicket.updateMany({
    where: {
      id: ticket.id,
      deletedAt: null,
      status: 'VALID',
      ...(markAsUsed ? { entryCount: 0 } : {})
    },
    data: {
      entryCount: { increment: 1 },
      scannedAt: ticket.scannedAt ?? now,
      scannedBy: input.scannerUid,
      ...(markAsUsed ? { status: 'USED' } : {})
    }
  });

  if (claimed.count === 0) {
    const fresh = await prisma.purchasedTicket.findFirst({
      where: { id: ticket.id },
      select: { status: true, entryCount: true, scannedAt: true }
    });
    if (fresh && entryBlocked(policy, fresh.entryCount, fresh.status)) {
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
        ticket: {
          ...summary,
          entryCount: fresh.entryCount,
          scannedAt: fresh.scannedAt?.toISOString() ?? summary.scannedAt
        }
      };
    }
    return { status: 'INVALID', message: 'Bilet doğrulanamadı', ticket: summary };
  }

  const nextEntryCount = ticket.entryCount + 1;

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
