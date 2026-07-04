import { NextRequest, NextResponse } from 'next/server';
import { guardAdminAutomationOrMutation } from '@/lib/auth/guard-admin-api';
import { ensureDbConnection } from '@/lib/db/prisma';
import { editPendingEventsWithAi } from '@/lib/scraper/ai/edit-events';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const guard = await guardAdminAutomationOrMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

  await ensureDbConnection();

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(body.limit ?? 300, 500);

  const stats = await editPendingEventsWithAi(limit);

  return NextResponse.json({
    ok: true,
    ...stats,
    message: `${stats.processed} etkinlik işlendi: ${stats.approved} onaylandı, ${stats.rejected} reddedildi.`
  });
}
