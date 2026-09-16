import type { UserRole } from '@/types';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { createEventInvitation } from '@/lib/services/event-invitations';
import { validateTicketInput } from '@/lib/services/ticket-validation';
import { loadSeriesSessionTargets } from '@/lib/tickets/combo-sessions';
import { buildPublicTicketPageUrl } from '@/lib/tickets/qr-image-url';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import { isComboTicketName, isSalesClosedTicketType } from '@/lib/tickets/purchase-types';

const BLOK3_SLUG = 'blok3-konseri';
const COMBO_TYPE_NAME = 'TEST Kombine Davetiye';
const CLOSED_TYPE_NAME = 'TEST Sistem Dışı Davetiye';

export type LiveScanStep = {
  label: string;
  status: string;
  message: string;
};

export type LiveTestInvitationResult = {
  kind: 'kombine' | 'sistem-disi';
  guestName: string;
  ticketTypeName: string;
  invitationOnly: boolean;
  ticketCode: string;
  inviteUrl: string;
  ticketUrl: string;
  qrPayload: string;
  scans: LiveScanStep[];
};

async function ensureInvitationTicketType(params: {
  eventId: string;
  name: string;
  description: string;
  saleEndDate: Date;
}) {
  const existing = await prisma.ticketType.findFirst({
    where: {
      eventId: params.eventId,
      name: params.name,
      deletedAt: null
    }
  });
  if (existing) {
    if (existing.status !== 'active' || existing.sold >= existing.capacity) {
      await prisma.ticketType.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          invitationOnly: true,
          type: 'invitation',
          price: 0,
          capacity: Math.max(existing.capacity, existing.sold + 10)
        }
      });
    }
    return existing.id;
  }

  const created = await prisma.ticketType.create({
    data: {
      eventId: params.eventId,
      name: params.name,
      description: params.description,
      type: 'invitation',
      invitationOnly: true,
      price: 0,
      currency: 'TRY',
      quantity: 50,
      sold: 0,
      capacity: 50,
      seatsPerUnit: 1,
      saleStartDate: new Date(),
      saleEndDate: params.saleEndDate,
      status: 'active',
      showLowStockBadge: false
    },
    select: { id: true }
  });
  return created.id;
}

async function scanQr(params: {
  qrRaw: string;
  gateEventId: string;
  markUsed: boolean;
  scannerUid: string;
  scannerEmail: string;
  scannerRole: UserRole;
  scannerUserId: string;
  scannerOrganizerId: string;
}): Promise<LiveScanStep> {
  const result = await validateTicketInput({
    qrRaw: params.qrRaw,
    gateEventId: params.gateEventId,
    markUsed: params.markUsed,
    scannerUid: params.scannerUid,
    scannerEmail: params.scannerEmail,
    scannerRole: params.scannerRole,
    scannerUserId: params.scannerUserId,
    scannerOrganizerId: params.scannerOrganizerId,
    device: 'live-test-invitations'
  });
  return {
    label: '',
    status: result.status,
    message: result.message
  };
}

export async function runLiveInvitationQrTest(): Promise<{
  event: { id: string; title: string; slug: string };
  sibling: { id: string; title: string } | null;
  checkoutHidesNewTypes: boolean;
  invitations: LiveTestInvitationResult[];
}> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { slug: BLOK3_SLUG, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      organizerId: true,
      startDate: true,
      endDate: true,
      organizer: {
        select: {
          id: true,
          owner: {
            select: {
              id: true,
              firebaseUid: true,
              email: true,
              role: true
            }
          }
        }
      }
    }
  });
  if (!event) {
    throw new Error('BLOK3 etkinliği bulunamadı');
  }

  const owner = event.organizer.owner;
  if (!owner?.firebaseUid) {
    throw new Error('BLOK3 organizatör sahibi bulunamadı');
  }

  const sessions = await loadSeriesSessionTargets(prisma, event.id);
  const sibling =
    sessions.find((session) => session.eventId !== event.id) ?? null;

  const comboTypeId = await ensureInvitationTicketType({
    eventId: event.id,
    name: COMBO_TYPE_NAME,
    description: 'Canlı test — kombine tek QR, satışa kapalı',
    saleEndDate: event.endDate
  });
  const closedTypeId = await ensureInvitationTicketType({
    eventId: event.id,
    name: CLOSED_TYPE_NAME,
    description: 'Canlı test — sistem dışı / satışa kapalı davetiye',
    saleEndDate: event.endDate
  });

  const stamp = Date.now();
  const comboInvite = await createEventInvitation({
    organizerId: event.organizerId,
    eventId: event.id,
    ticketTypeId: comboTypeId,
    guestName: 'LIVE-TEST Kombine',
    guestEmail: `live-test-kombine+${stamp}@biletfeed.local`,
    skipEmail: true
  });
  const closedInvite = await createEventInvitation({
    organizerId: event.organizerId,
    eventId: event.id,
    ticketTypeId: closedTypeId,
    guestName: 'LIVE-TEST Sistem Dışı',
    guestEmail: `live-test-sistem-disi+${stamp}@biletfeed.local`,
    skipEmail: true
  });

  const scanner = {
    scannerUid: owner.firebaseUid,
    scannerEmail: owner.email ?? undefined,
    scannerRole: owner.role as UserRole,
    scannerUserId: owner.id,
    scannerOrganizerId: event.organizerId
  };

  const invitations: LiveTestInvitationResult[] = [];

  for (const invite of [
    { kind: 'kombine' as const, row: comboInvite, expectedCombo: true },
    { kind: 'sistem-disi' as const, row: closedInvite, expectedCombo: false }
  ]) {
    const ticket = await prisma.purchasedTicket.findFirst({
      where: { ticketCode: invite.row.ticketCode, deletedAt: null },
      include: { ticketType: { select: { name: true, invitationOnly: true, type: true } } }
    });
    if (!ticket) {
      throw new Error(`Bilet bulunamadı: ${invite.row.ticketCode}`);
    }

    const qrRaw = buildTicketQrPayload({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      validationToken: ticket.validationToken
    });
    const scans: LiveScanStep[] = [];

    const day1Preview = await scanQr({
      ...scanner,
      qrRaw,
      gateEventId: event.id,
      markUsed: false
    });
    scans.push({ ...day1Preview, label: 'BLOK3 önizleme (markUsed:false)' });

    const day1Mark = await scanQr({
      ...scanner,
      qrRaw,
      gateEventId: event.id,
      markUsed: true
    });
    scans.push({ ...day1Mark, label: 'BLOK3 giriş (1. okutma)' });

    const day1Replay = await scanQr({
      ...scanner,
      qrRaw,
      gateEventId: event.id,
      markUsed: true
    });
    scans.push({ ...day1Replay, label: 'BLOK3 tekrar (aynı gün)' });

    if (sibling) {
      const day2 = await scanQr({
        ...scanner,
        qrRaw,
        gateEventId: sibling.eventId,
        markUsed: true
      });
      scans.push({
        ...day2,
        label: `${sibling.title} kapısı`
      });
    }

    invitations.push({
      kind: invite.kind,
      guestName: invite.row.guestName,
      ticketTypeName: ticket.ticketType.name,
      invitationOnly: isSalesClosedTicketType(ticket.ticketType),
      ticketCode: ticket.ticketCode,
      inviteUrl: getSiteUrl(`/davetiye/${invite.row.inviteToken}`),
      ticketUrl: buildPublicTicketPageUrl({
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken,
        ticketId: ticket.id
      }),
      qrPayload: qrRaw,
      scans
    });

    if (invite.expectedCombo && !isComboTicketName(ticket.ticketType.name)) {
      throw new Error('Kombine test türü isComboTicketName eşleşmedi');
    }
  }

  const publicTypes = await prisma.ticketType.findMany({
    where: {
      eventId: event.id,
      deletedAt: null,
      name: { in: [COMBO_TYPE_NAME, CLOSED_TYPE_NAME] }
    },
    select: { name: true, invitationOnly: true, type: true }
  });
  const checkoutHidesNewTypes = publicTypes.every((type) =>
    isSalesClosedTicketType(type)
  );

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    sibling: sibling
      ? { id: sibling.eventId, title: sibling.title }
      : null,
    checkoutHidesNewTypes,
    invitations
  };
}
