import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifyPanelSessionCookie } from '@/lib/auth/session';
import {
  getAdminAuth,
  isFirebaseAdminConfigured
} from '@/lib/firebase/admin';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'auth-panel-custom-token', 90, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifyPanelSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Panel oturumu gerekli' }, { status: 401 });
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
      { error: 'Panel oturum senkronizasyonu başarısız' },
      { status: 500 }
    );
  }
}
