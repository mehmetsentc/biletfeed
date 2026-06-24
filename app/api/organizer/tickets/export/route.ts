import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import { exportOrganizerTicketsCsv } from '@/lib/services/ticket-admin';

export async function GET(request: NextRequest) {
  const auth = await requireOrganizerApi();
  if (auth.error) return auth.error;

  const csv = await exportOrganizerTicketsCsv(auth.ctx.organizer.id);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="biletler-${Date.now()}.csv"`
    }
  });
}
