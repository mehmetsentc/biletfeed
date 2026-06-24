import { NextRequest, NextResponse } from 'next/server';
import { getPublicTicketByCode } from '@/lib/services/tickets';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapPublicTicketToPdf } from '@/lib/tickets/pdf/map-ticket-data';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code')?.trim() ?? '';
  const token = searchParams.get('token')?.trim() ?? '';
  const id = searchParams.get('id')?.trim() ?? '';

  if (!code || !token || !id) {
    return NextResponse.json({ error: 'Geçersiz bilet bağlantısı' }, { status: 400 });
  }

  const ticket = await getPublicTicketByCode(code, token, id);
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  const pdfInput = mapPublicTicketToPdf(ticket);
  const buffer = await generateTicketPdf(pdfInput);
  const filename = buildTicketPdfFilename(ticket.event.title, ticket.ticketCode);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
