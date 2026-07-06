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
};

export async function createBulkEventInvitations(params: {
  organizerId: string;
  eventId: string;
  ticketTypeId: string;
  guests: BulkGuestInput[];
  sendEmails?: boolean;
}): Promise<BulkInvitationResult> {
  const created: InvitationRow[] = [];
  const errors: BulkInvitationResult['errors'] = [];

  for (const guest of params.guests) {
    try {
      const invitation = await createEventInvitation({
        organizerId: params.organizerId,
        eventId: params.eventId,
        ticketTypeId: params.ticketTypeId,
        guestName: guest.guestName,
        guestEmail: params.sendEmails ? guest.guestEmail : undefined,
        guestPhone: guest.guestPhone,
        personalMessage: guest.personalMessage,
        skipEmail: params.sendEmails ?? false
      });
      created.push(invitation);
    } catch (err) {
      errors.push({
        guestName: guest.guestName,
        error: err instanceof Error ? err.message : 'Davetiye oluşturulamadı'
      });
    }
  }

  if (params.sendEmails && created.length > 0) {
    void sendBulkInvitationEmails({
      organizerId: params.organizerId,
      invitationIds: created.map((row) => row.id)
    }).catch((err) => {
      console.error('[email] bulk invitations', err);
    });
  }

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
}): Promise<void> {
  await ensureDbConnection();
  if (params.invitationIds.length === 0) return;

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

  for (const [email, ids] of Array.from(emailGroups.entries())) {
    if (ids.length === 1) {
      await sendEventInvitationEmail(ids[0]!, params.organizerId);
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

    await queueEmail({
      to: email,
      subject: `BiletFeed — ${first.event.title} davetiyeleriniz (${ids.length} adet)`,
      template: 'event_invitation_bulk',
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
  }
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
