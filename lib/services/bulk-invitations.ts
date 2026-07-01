import JSZip from 'jszip';
import {
  createEventInvitation,
  type InvitationRow
} from '@/lib/services/event-invitations';
import { generateOrganizerInvitationPdf } from '@/lib/services/invitation-pdf';

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
        personalMessage: guest.personalMessage
      });
      created.push(invitation);
    } catch (err) {
      errors.push({
        guestName: guest.guestName,
        error: err instanceof Error ? err.message : 'Davetiye oluşturulamadı'
      });
    }
  }

  return { created, errors };
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
