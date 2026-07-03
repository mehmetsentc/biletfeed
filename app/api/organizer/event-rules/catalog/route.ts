import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { getRuleCatalog } from '@/lib/services/event-rules';

export async function GET(_request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const catalog = await getRuleCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Katalog yüklenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
