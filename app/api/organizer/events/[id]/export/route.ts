import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import { exportEventSalesCsv } from '@/lib/services/organizer-event-export';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireOrganizerApi();
  if (auth.error) return auth.error;

  const { id } = await params;
  const csv = await exportEventSalesCsv(auth.ctx.organizer.id, id);
  if (!csv) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="etkinlik-${id.slice(0, 8)}-rapor.csv"`
    }
  });
}
