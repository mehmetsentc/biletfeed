import { NextRequest, NextResponse } from 'next/server';
import { getPublicInvitation } from '@/lib/services/event-invitations';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapInvitationToPdf } from '@/lib/tickets/pdf/map-ticket-data';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  if (!invitation) {
    return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 });
  }

  const pdfInput = mapInvitationToPdf(invitation);
  const buffer = await generateTicketPdf(pdfInput);
  const filename = buildTicketPdfFilename(invitation.event.title, invitation.ticketCode);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
