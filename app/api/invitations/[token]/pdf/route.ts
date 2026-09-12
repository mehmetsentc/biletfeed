import { NextRequest, NextResponse } from 'next/server';
import { getPublicInvitation } from '@/lib/services/event-invitations';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapInvitationToPdf } from '@/lib/tickets/pdf/map-ticket-data';
import {
  bundleNamedPdfs,
  buildInvitationZipFilename
} from '@/lib/tickets/pdf/zip-pdfs';

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

  const cards =
    invitation.tickets.length > 0
      ? invitation.tickets
      : [
          {
            ticketCode: invitation.ticketCode,
            ticketStatus: invitation.ticketStatus,
            event: invitation.event,
            qrData: invitation.qrData
          }
        ];

  const files = await Promise.all(
    cards.map(async (ticket) => {
      const pdfInput = mapInvitationToPdf({
        guestName: invitation.guestName,
        personalMessage: invitation.personalMessage,
        ticketCode: ticket.ticketCode,
        ticketStatus: ticket.ticketStatus,
        ticketTypeName: invitation.ticketTypeName,
        event: ticket.event,
        qrData: ticket.qrData
      });
      return {
        filename: buildTicketPdfFilename(ticket.event.title, ticket.ticketCode),
        content: await generateTicketPdf(pdfInput)
      };
    })
  );

  const bundled = await bundleNamedPdfs(
    files,
    buildInvitationZipFilename(invitation.event.title)
  );
  if (!bundled) {
    return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(bundled.buffer), {
    headers: {
      'Content-Type': bundled.contentType,
      'Content-Disposition': `attachment; filename="${bundled.filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
