import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  adminEventEditorHasActiveFilter,
  listAdminEditorEvents
} from '@/lib/services/admin-events';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('events.view');
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(request.url);
  const filterInput = {
    kategori: searchParams.get('kategori') ?? undefined,
    sehir: searchParams.get('sehir') ?? undefined,
    tarih: searchParams.get('tarih') ?? undefined,
    q: searchParams.get('q') ?? undefined
  };

  const { rows } = await listAdminEditorEvents({
    ...filterInput,
    upcomingOnly: !adminEventEditorHasActiveFilter(filterInput)
  });

  return NextResponse.json({
    events: rows,
    total: rows.length
  });
}
