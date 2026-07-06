import { NextResponse } from 'next/server';
import {
  resolveOrganizerSession,
  type OrganizerSessionDenyReason
} from '@/lib/auth/organizer-api';

function organizerSessionDenyResponse(reason: OrganizerSessionDenyReason): NextResponse {
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

export async function requireOrganizerApi() {
  const resolved = await resolveOrganizerSession();
  if (!resolved.ok) {
    return {
      error: organizerSessionDenyResponse(resolved.reason),
      ctx: null as never
    };
  }
  return { error: null, ctx: resolved.ctx };
}
