import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminConfigured, getAdminAuth } from '@/lib/firebase/admin';
import { syncUserFromFirebase } from '@/lib/services/users';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000; // 5 gün

export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: 'Firebase Admin yapılandırması eksik' },
        { status: 503 }
      );
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS
    });

    try {
      await syncUserFromFirebase({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        displayName:
          decoded.name || decoded.email?.split('@')[0] || 'Kullanıcı',
        photoURL: decoded.picture
      });
    } catch {
      // DB senkronu başarısız olsa da oturum çerezi oluştur
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRES_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Oturum oluşturulamadı' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/'
  });
  return response;
}
