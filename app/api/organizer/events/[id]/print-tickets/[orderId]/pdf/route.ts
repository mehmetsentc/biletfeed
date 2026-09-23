import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { generatePrintSheetPdf } from '@/lib/tickets/pdf/generate-print-sheet';
import { loadPrintSheetForOrder } from '@/lib/services/print-tickets';

export const runtime = 'nodejs';
export const maxDuration = 120;

type RouteContext = { params: Promise<{ id: string; orderId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id, orderId } = await context.params;
  const sheet = await loadPrintSheetForOrder(ctx.organizer.id, id, orderId);
  if (!sheet || sheet.tickets.length === 0) {
    return NextResponse.json({ error: 'Baskı partisi bulunamadı' }, { status: 404 });
  }

  const pdf = await generatePrintSheetPdf(sheet.tickets);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sheet.filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
