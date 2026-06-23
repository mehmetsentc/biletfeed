import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  try {
    const { recategorizePublishedEvents } = await import(
      '@/lib/scraper/recategorize-events'
    );
    const result = await recategorizePublishedEvents();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
