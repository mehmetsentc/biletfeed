import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

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
