import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import { exportOrganizerTicketsCsv } from '@/lib/services/ticket-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = await requireOrganizerApi();
  if (auth.error) return auth.error;

  const eventId = request.nextUrl.searchParams.get('eventId') ?? undefined;
  const csv = await exportOrganizerTicketsCsv(auth.ctx.organizer.id, eventId);

  const filename = eventId
    ? `biletler-${eventId.slice(0, 8)}.csv`
    : `biletler-${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
