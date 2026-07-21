import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  verifyPanelSessionCookie,
  verifySessionCookie
} from '@/lib/auth/session';
import {
  getAdminAuth,
  isFirebaseAdminConfigured
} from '@/lib/firebase/admin';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/** session VEYA panel_session — alt alanlar arası Firebase hizalama */
async function verifyAnyAuthCookie() {
  return (await verifySessionCookie()) ?? (await verifyPanelSessionCookie());
}

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'auth-custom-token', 90, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifyAnyAuthCookie();
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase Admin yapılandırması eksik' },
      { status: 503 }
    );
  }

  try {
    const token = await getAdminAuth().createCustomToken(session.uid);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: 'Oturum senkronizasyonu başarısız' },
      { status: 500 }
    );
  }
}
