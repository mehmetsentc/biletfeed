import { NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { getOrganizerSalesStats } from '@/lib/services/organizer-sales-stats';

export async function GET(request: Request) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || undefined;

  const stats = await getOrganizerSalesStats(ctx.organizer.id, eventId);
  return NextResponse.json(stats);
}
