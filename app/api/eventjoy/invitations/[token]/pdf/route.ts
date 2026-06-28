import { NextRequest, NextResponse } from 'next/server';
import type { EventJoyPublicInvitation } from '@/lib/eventjoy/invitations';
import {
  formatEventJoyDateTime,
  getEventJoyInvitation,
  getEventJoyInviteUrl
} from '@/lib/eventjoy/invitations';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import type { TicketPdfInput } from '@/lib/tickets/pdf/types';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ token: string }>;
}

function mapEventJoyToPdf(invitation: EventJoyPublicInvitation): TicketPdfInput {
  const { dateLabel, timeLabel } = formatEventJoyDateTime(
    invitation.date,
    invitation.time
  );
  const inviteUrl = getEventJoyInviteUrl(invitation.token);

  return {
    kind: 'invitation',
    eventTitle: invitation.title,
    coverImageUrl: invitation.coverImage,
    eventDate: dateLabel,
    eventTime: timeLabel,
    venue: invitation.location || 'Belirtilecek',
    city: '',
    ticketTypeName: invitation.type,
    holderName: invitation.hostName,
    ticketCode: `EJ-${invitation.token.slice(0, 8).toUpperCase()}`,
    qrData: inviteUrl,
    status: 'VALID',
    personalMessage: invitation.personalMessage
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const invitation = await getEventJoyInvitation(token);
  if (!invitation) {
    return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 });
  }

  const pdfInput = mapEventJoyToPdf(invitation);
  const buffer = await generateTicketPdf(pdfInput);
  const filename = buildTicketPdfFilename(invitation.title, pdfInput.ticketCode);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
