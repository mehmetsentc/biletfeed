import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { seedEventRulesCatalog } from '@/lib/seed/event-rules';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role as never)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

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
