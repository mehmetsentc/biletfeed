import JSZip from 'jszip';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { queueEmail } from '@/lib/accounting/email';
import {
  buildBulkInvitationZipEmail,
  buildBulkInvitationZipPlainText
} from '@/lib/email/invitation-template';
import {
  createEventInvitation,
  sendEventInvitationEmail,
  type InvitationRow
} from '@/lib/services/event-invitations';
import { generateOrganizerInvitationPdf } from '@/lib/services/invitation-pdf';
import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';

export type BulkGuestInput = {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  personalMessage?: string;
};

export type BulkInvitationResult = {
  created: InvitationRow[];
  errors: Array<{ guestName: string; error: string }>;
  email?: {
    attempted: number;
    sent: number;
    failed: number;
    errors: string[];
  };
};

export async function createBulkEventInvitations(params: {
  organizerId: string;
  eventId: string;
  ticketTypeId: string;
  guests: BulkGuestInput[];
  sendEmails?: boolean;
}): Promise<BulkInvitationResult> {
  await ensureDbConnection();

  const created: InvitationRow[] = [];
  const errors: BulkInvitationResult['errors'] = [];

  const ticketType = await prisma.ticketType.findFirst({
    where: {
      id: params.ticketTypeId,
      eventId: params.eventId,
      deletedAt: null,
      event: { organizerId: params.organizerId, deletedAt: null }
    },
    select: {
      capacity: true,
      sold: true,
      name: true,
      _count: {
        select: {
          purchasedTickets: { where: { deletedAt: null } }
        }
      }
    }
  });

  if (!ticketType) {
    return {
      created: [],
      errors: params.guests.map((guest) => ({
        guestName: guest.guestName,
        error: 'Bilet türü bulunamadı'
      }))
    };
  }

  // sold sayacı kaymış olabilir — gerçek satılan bileti esas al
  const actualSold = ticketType._count.purchasedTickets;
  if (ticketType.sold !== actualSold) {
    await prisma.ticketType.update({
      where: { id: params.ticketTypeId },
      data: { sold: actualSold }
    });
  }

  const remaining = Math.max(0, ticketType.capacity - actualSold);
  if (remaining === 0) {
    return {
      created: [],
      errors: params.guests.map((guest) => ({
        guestName: guest.guestName,
        error: 'Bu bilet türü için kontenjan kalmadı'
      }))
    };
  }

  // Kontenjanı aşan adayları baştan ayır — kısmi başarısızlığı netleştir
  const guestsToCreate = params.guests.slice(0, remaining);
  for (const guest of params.guests.slice(remaining)) {
    errors.push({
      guestName: guest.guestName,
      error: `Kontenjan yetersiz (kalan: ${remaining}/${ticketType.capacity})`
    });
  }

  for (const guest of guestsToCreate) {
    try {
      const invitation = await createEventInvitation({
        organizerId: params.organizerId,
        eventId: params.eventId,
        ticketTypeId: params.ticketTypeId,
        guestName: guest.guestName,
        guestEmail: guest.guestEmail,
        guestPhone: guest.guestPhone,
        personalMessage: guest.personalMessage,
        skipEmail: true
      });
      created.push(invitation);
    } catch (err) {
      errors.push({
        guestName: guest.guestName,
        error: err instanceof Error ? err.message : 'Davetiye oluşturulamadı'
      });
    }
  }

  // E-posta route'ta after() ile arka planda gönderilir — burada beklenmez
  return { created, errors };
}

function groupByEmail(
  rows: Array<{ id: string; guestEmail: string | null; guestName: string; ticketCode: string }>
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const row of rows) {
    const email = row.guestEmail?.trim().toLowerCase();
    if (!email) continue;
    const ids = groups.get(email) ?? [];
    ids.push(row.id);
    groups.set(email, ids);
  }

  return groups;
}

/** Aynı e-postaya giden toplu davetiyeleri ZIP ile tek mailde gönderir */
export async function sendBulkInvitationEmails(params: {
  organizerId: string;
  invitationIds: string[];
}): Promise<{
  attempted: number;
  sent: number;
  failed: number;
  errors: string[];
}> {
  await ensureDbConnection();
  if (params.invitationIds.length === 0) {
    return { attempted: 0, sent: 0, failed: 0, errors: [] };
  }

  const rows = await prisma.eventInvitation.findMany({
    where: {
      id: { in: params.invitationIds },
      organizerId: params.organizerId,
      deletedAt: null
    },
    include: {
      purchasedTicket: { select: { ticketCode: true, orderId: true } },
      event: {
        select: {
          title: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          organizer: { select: { name: true } },
          venue: { select: { name: true } },
          city: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const emailGroups = groupByEmail(
    rows.map((row) => ({
      id: row.id,
      guestEmail: row.guestEmail,
      guestName: row.guestName,
      ticketCode: row.purchasedTicket.ticketCode
    }))
  );

  let attempted = 0;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const [email, ids] of Array.from(emailGroups.entries())) {
    attempted += 1;
    try {
      if (ids.length === 1) {
        const single = await sendEventInvitationEmail(ids[0]!, params.organizerId);
        if (single.status === 'sent') {
          sent += 1;
        } else if (single.status === 'failed') {
          failed += 1;
          errors.push(`${email}: ${single.error ?? 'gönderilemedi'}`);
        }
        continue;
      }

      const groupRows = rows.filter((row) => ids.includes(row.id));
      const first = groupRows[0];
      if (!first) continue;

      const eventDate = formatTurkeyDateLong(first.event.startDate);
      const eventTime = formatTurkeyTime(first.event.startDate);
      const venueName = first.event.venue?.name ?? 'Online';
      const cityName = first.event.city.name;
      const recipientName = first.guestName.replace(/\s+#\d+$/, '').trim() || first.guestName;
      const zipBuffer = await buildInvitationsZip(ids, params.organizerId);
      const zipFilename = `BiletFeed-Davetiyeler-${sanitizeZipLabel(first.event.title)}.zip`;

      const result = await queueEmail({
        to: email,
        subject: `BiletFeed — ${first.event.title} davetiyeleriniz (${ids.length} adet)`,
        template: 'event_invitation_bulk',
        sender: 'invitation',
        html: buildBulkInvitationZipEmail({
          recipientName,
          eventTitle: first.event.title,
          eventDate,
          eventTime,
          eventVenue: venueName,
          eventCity: cityName,
          coverImage: first.event.coverImage ?? '',
          organizerName: first.event.organizer.name,
          ticketCount: ids.length,
          tickets: groupRows.map((row) => ({
            guestName: row.guestName,
            ticketCode: row.purchasedTicket.ticketCode
          }))
        }),
        text: buildBulkInvitationZipPlainText({
          recipientName,
          eventTitle: first.event.title,
          eventDate,
          eventTime,
          eventVenue: venueName,
          eventCity: cityName,
          ticketCount: ids.length,
          tickets: groupRows.map((row) => ({
            guestName: row.guestName,
            ticketCode: row.purchasedTicket.ticketCode
          }))
        }),
        orderId: first.purchasedTicket.orderId,
        attachments: [{ filename: zipFilename, content: zipBuffer }]
      });

      if (result.status === 'sent') {
        sent += 1;
      } else {
        failed += 1;
        errors.push(`${email}: ${result.error ?? 'gönderilemedi'}`);
      }
    } catch (err) {
      failed += 1;
      errors.push(
        `${email}: ${err instanceof Error ? err.message : 'gönderilemedi'}`
      );
    }
  }

  return { attempted, sent, failed, errors };
}

function sanitizeZipLabel(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'davetiye'
  );
}

export async function buildInvitationsZip(
  invitationIds: string[],
  organizerId: string
): Promise<Buffer> {
  const zip = new JSZip();

  for (const id of invitationIds) {
    const pdf = await generateOrganizerInvitationPdf(id, organizerId);
    if (!pdf) continue;
    zip.file(pdf.filename, pdf.buffer);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
