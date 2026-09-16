import type { UserRole } from '@/types';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { createEventInvitation } from '@/lib/services/event-invitations';
import { validateTicketInput } from '@/lib/services/ticket-validation';
import { loadSeriesSessionTargets } from '@/lib/tickets/combo-sessions';
import { buildPublicTicketPageUrl } from '@/lib/tickets/qr-image-url';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import { isComboTicketName, isSalesClosedTicketType } from '@/lib/tickets/purchase-types';
import { buildSessionCookie } from '@/lib/auth/session';

const BLOK3_SLUG = 'blok3-konseri';
const COMBO_TYPE_NAME = 'TEST Kombine Davetiye';
const CLOSED_TYPE_NAME = 'TEST Sistem Dışı Davetiye';
const PRODUCTION_ORIGIN = 'https://biletfeed.com';

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

type Owner = {
  id: string;
  firebaseUid: string;
  email: string | null;
  role: string;
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

function hasTicketSecret(): boolean {
  return Boolean(process.env.TICKET_SECRET_KEY?.trim());
}

const ZEYNEP_SLUG = 'zeynep-bastik-emir-can-igrek-koseri';

async function ensureAntalyaComboSeries(blok3Id: string, organizerId: string) {
  const existing = await loadSeriesSessionTargets(prisma, blok3Id);
  if (existing.length >= 2) return;

  const zeynep = await prisma.event.findFirst({
    where: { slug: ZEYNEP_SLUG, organizerId, deletedAt: null },
    select: { id: true, seo: true, startDate: true }
  });
  const blok3 = await prisma.event.findFirst({
    where: { id: blok3Id, deletedAt: null },
    select: { id: true, seo: true, startDate: true }
  });
  if (!zeynep || !blok3) return;

  const seriesId =
    (typeof (blok3.seo as { seriesId?: unknown } | null)?.seriesId === 'string'
      ? (blok3.seo as { seriesId: string }).seriesId
      : null) ||
    (typeof (zeynep.seo as { seriesId?: unknown } | null)?.seriesId === 'string'
      ? (zeynep.seo as { seriesId: string }).seriesId
      : null) ||
    crypto.randomUUID();

  const ordered = [blok3, zeynep].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
  for (let i = 0; i < ordered.length; i++) {
    const row = ordered[i]!;
    const seo =
      row.seo && typeof row.seo === 'object' && !Array.isArray(row.seo)
        ? { ...(row.seo as Record<string, unknown>) }
        : {};
    await prisma.event.update({
      where: { id: row.id },
      data: {
        seo: {
          ...seo,
          seriesId,
          sessionIndex: i,
          sessionCount: ordered.length
        }
      }
    });
  }
}

function productionHeaders(sessionToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${sessionToken}`,
    Cookie: `panel_session=${sessionToken}; session=${sessionToken}`,
    Origin: PRODUCTION_ORIGIN,
    Referer: `${PRODUCTION_ORIGIN}/`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
}

async function createInviteOnProduction(params: {
  sessionToken: string;
  eventId: string;
  ticketTypeId: string;
  guestName: string;
  guestEmail: string;
}): Promise<{ ticketCode: string; inviteToken: string; qrData: string }> {
  const response = await fetch(`${PRODUCTION_ORIGIN}/api/organizer/invitations`, {
    method: 'POST',
    headers: productionHeaders(params.sessionToken),
    body: JSON.stringify({
      eventId: params.eventId,
      ticketTypeId: params.ticketTypeId,
      guestName: params.guestName,
      guestEmail: params.guestEmail
    })
  });
  const payload = (await response.json()) as {
    error?: string;
    invitation?: {
      ticketCode: string;
      inviteToken: string;
      qrData: string;
    };
  };
  if (!response.ok || !payload.invitation) {
    throw new Error(
      `Production davetiye API: ${payload.error ?? response.status}`
    );
  }
  return payload.invitation;
}

async function scanOnProduction(params: {
  sessionToken: string;
  qrRaw: string;
  eventId: string;
  markUsed: boolean;
}): Promise<LiveScanStep> {
  const response = await fetch(`${PRODUCTION_ORIGIN}/api/tickets/validate`, {
    method: 'POST',
    headers: productionHeaders(params.sessionToken),
    body: JSON.stringify({
      qrRaw: params.qrRaw,
      eventId: params.eventId,
      markUsed: params.markUsed
    })
  });
  const payload = (await response.json()) as {
    error?: string;
    status?: string;
    message?: string;
  };
  if (!response.ok) {
    return {
      label: '',
      status: 'ERROR',
      message: payload.error ?? `HTTP ${response.status}`
    };
  }
  return {
    label: '',
    status: payload.status ?? 'UNKNOWN',
    message: payload.message ?? ''
  };
}

async function scanLocal(params: {
  qrRaw: string;
  gateEventId: string;
  markUsed: boolean;
  scannerUid: string;
  scannerEmail?: string;
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
  viaProductionApi: boolean;
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

  const owner: Owner = event.organizer.owner;
  if (!owner?.firebaseUid) {
    throw new Error('BLOK3 organizatör sahibi bulunamadı');
  }

  await ensureAntalyaComboSeries(event.id, event.organizerId);
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

  const viaProductionApi = !hasTicketSecret();
  let sessionToken: string | null = null;
  if (viaProductionApi) {
    if (!process.env.NEXTAUTH_SECRET?.trim()) {
      throw new Error(
        'Preview TICKET_SECRET_KEY ve NEXTAUTH_SECRET yok; production HMAC/oturum kurulamadı'
      );
    }
    sessionToken = buildSessionCookie(
      owner.firebaseUid,
      owner.email ?? '',
      owner.role as UserRole
    );
  }

  const stamp = Date.now();
  const specs = [
    {
      kind: 'kombine' as const,
      ticketTypeId: comboTypeId,
      guestName: 'LIVE-TEST Kombine',
      guestEmail: `live-test-kombine+${stamp}@biletfeed.local`,
      expectedCombo: true
    },
    {
      kind: 'sistem-disi' as const,
      ticketTypeId: closedTypeId,
      guestName: 'LIVE-TEST Sistem Dışı',
      guestEmail: `live-test-sistem-disi+${stamp}@biletfeed.local`,
      expectedCombo: false
    }
  ];

  const invitations: LiveTestInvitationResult[] = [];

  for (const spec of specs) {
    let ticketCode: string;
    let inviteToken: string;
    let qrRaw: string;

    if (viaProductionApi && sessionToken) {
      const created = await createInviteOnProduction({
        sessionToken,
        eventId: event.id,
        ticketTypeId: spec.ticketTypeId,
        guestName: spec.guestName,
        guestEmail: spec.guestEmail
      });
      ticketCode = created.ticketCode;
      inviteToken = created.inviteToken;
      qrRaw = created.qrData;
    } else {
      const created = await createEventInvitation({
        organizerId: event.organizerId,
        eventId: event.id,
        ticketTypeId: spec.ticketTypeId,
        guestName: spec.guestName,
        guestEmail: spec.guestEmail,
        skipEmail: true
      });
      ticketCode = created.ticketCode;
      inviteToken = created.inviteToken;
      const ticket = await prisma.purchasedTicket.findFirst({
        where: { ticketCode, deletedAt: null },
        select: { id: true, validationToken: true }
      });
      if (!ticket) throw new Error(`Bilet bulunamadı: ${ticketCode}`);
      qrRaw = buildTicketQrPayload({
        ticketId: ticket.id,
        ticketCode,
        validationToken: ticket.validationToken
      });
    }

    const ticket = await prisma.purchasedTicket.findFirst({
      where: { ticketCode, deletedAt: null },
      include: { ticketType: { select: { name: true, invitationOnly: true, type: true } } }
    });
    if (!ticket) {
      throw new Error(`Bilet kaydı yok: ${ticketCode}`);
    }

    const scan = async (
      gateEventId: string,
      markUsed: boolean
    ): Promise<LiveScanStep> => {
      if (viaProductionApi && sessionToken) {
        return scanOnProduction({
          sessionToken,
          qrRaw,
          eventId: gateEventId,
          markUsed
        });
      }
      return scanLocal({
        qrRaw,
        gateEventId,
        markUsed,
        scannerUid: owner.firebaseUid,
        scannerEmail: owner.email ?? undefined,
        scannerRole: owner.role as UserRole,
        scannerUserId: owner.id,
        scannerOrganizerId: event.organizerId
      });
    };

    const scans: LiveScanStep[] = [];
    scans.push({
      ...(await scan(event.id, false)),
      label: 'BLOK3 önizleme (markUsed:false)'
    });
    scans.push({
      ...(await scan(event.id, true)),
      label: 'BLOK3 giriş (1. okutma)'
    });
    scans.push({
      ...(await scan(event.id, true)),
      label: 'BLOK3 tekrar (aynı gün)'
    });
    if (sibling) {
      scans.push({
        ...(await scan(sibling.eventId, true)),
        label: `${sibling.title} kapısı`
      });
    }

    invitations.push({
      kind: spec.kind,
      guestName: spec.guestName,
      ticketTypeName: ticket.ticketType.name,
      invitationOnly: isSalesClosedTicketType(ticket.ticketType),
      ticketCode,
      inviteUrl: getSiteUrl(`/davetiye/${inviteToken}`),
      ticketUrl: buildPublicTicketPageUrl({
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken,
        ticketId: ticket.id
      }),
      qrPayload: qrRaw,
      scans
    });

    if (spec.expectedCombo && !isComboTicketName(ticket.ticketType.name)) {
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
    sibling: sibling ? { id: sibling.eventId, title: sibling.title } : null,
    checkoutHidesNewTypes,
    viaProductionApi,
    invitations
  };
}
