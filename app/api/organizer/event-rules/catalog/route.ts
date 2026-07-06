import { NextRequest, NextResponse } from 'next/server';
import {
  resolveOrganizerSession,
  type OrganizerSessionDenyReason
} from '@/lib/auth/organizer-api';
import { loadEventRulesCatalog } from '@/lib/services/event-rules-catalog';

function organizerSessionError(reason: OrganizerSessionDenyReason): NextResponse {
  switch (reason) {
    case 'no_session':
      return NextResponse.json({ error: 'Panel girişi gerekli' }, { status: 401 });
    case 'no_user':
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 });
    case 'no_organizer':
      return NextResponse.json(
        { error: 'Organizatör profili bulunamadı. Kurulumu tamamlayın.' },
        { status: 403 }
      );
    case 'suspended':
      return NextResponse.json({ error: 'Hesabınız askıya alındı.' }, { status: 403 });
  }
}

export async function GET(_request: NextRequest) {
  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return organizerSessionError(resolved.reason);
  }

  try {
    const catalog = await loadEventRulesCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Katalog yüklenemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
