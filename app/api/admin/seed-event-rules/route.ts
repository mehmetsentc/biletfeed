import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { seedEventRulesCatalog } from '@/lib/seed/event-rules';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'settings.manage');
  if ('error' in guard) return guard.error;

  try {
    const result = await seedEventRulesCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Seed başarısız' },
      { status: 500 }
    );
  }
}
