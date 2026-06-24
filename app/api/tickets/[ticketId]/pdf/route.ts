import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { getTicketById } from '@/lib/services/tickets';
import { incrementTicketDownload } from '@/lib/services/ticket-validation';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapPurchasedTicketToPdf } from '@/lib/tickets/pdf/map-ticket-data';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ ticketId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId, session.uid);
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  const pdfInput = mapPurchasedTicketToPdf(ticket);
  const buffer = await generateTicketPdf(pdfInput);
  const filename = buildTicketPdfFilename(ticket.eventTitle, ticket.code);

  await incrementTicketDownload(ticketId).catch(() => {});

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
