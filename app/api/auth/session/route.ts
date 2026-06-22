import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { isFirebaseAdminConfigured, getAdminAuth } from '@/lib/firebase/admin';
import {
  syncUserFromFirebase,
  syncFirebaseCustomClaims,
  getUserByFirebaseUid
} from '@/lib/services/users';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000; // 5 gün

// Firebase Admin olmadığında imzalı JSON session için gizli anahtar
const SIMPLE_SESSION_SECRET =
  process.env.NEXTAUTH_SECRET ??
  process.env.TICKET_SECRET_KEY ??
  'biletfeed-simple-session-fallback-key';

function buildSimpleSession(
  uid: string,
  email: string,
  role: string,
  expiresMs: number
): string {
  const payload = JSON.stringify({ uid, email, role, exp: Date.now() + expiresMs });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', SIMPLE_SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

/** Firebase REST API ile ID token'ı doğrular — Admin SDK gerekmez */
async function verifyIdTokenViaRestApi(
  idToken: string
): Promise<{ uid: string; email: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY ayarlanmamış');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );

  if (!res.ok) throw new Error('Token geçersiz');

  const data = (await res.json()) as {
    users?: Array<{ localId: string; email?: string }>;
  };
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Kullanıcı bulunamadı');

  return { uid: user.localId, email: user.email ?? '' };
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
    }

    // ── Firebase Admin SDK varsa: tam oturum cookie oluştur ──────────────────
    if (isFirebaseAdminConfigured()) {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(idToken);

      try {
        await syncUserFromFirebase({
          firebaseUid: decoded.uid,
          email: decoded.email || '',
          displayName:
            decoded.name || decoded.email?.split('@')[0] || 'Kullanıcı',
          photoURL: decoded.picture
        });
      } catch {
        // DB hatası oturumu engellemesin
      }

      const dbUser = await getUserByFirebaseUid(decoded.uid);
      if (dbUser) {
        await syncFirebaseCustomClaims(decoded.uid, dbUser.role);
      }

      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_EXPIRES_MS
      });

      const response = NextResponse.json({
        success: true,
        role: dbUser?.role ?? null
      });
      response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
        maxAge: SESSION_EXPIRES_MS / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return response;
    }

    // ── Firebase Admin yoksa: REST API ile doğrula + imzalı JSON session ─────
    const { uid, email } = await verifyIdTokenViaRestApi(idToken);

    try {
      await syncUserFromFirebase({
        firebaseUid: uid,
        email,
        displayName: email.split('@')[0] || 'Kullanıcı'
      });
    } catch {
      // DB hatası oturumu engellemesin
    }

    const sessionCookie = buildSimpleSession(uid, email, 'USER', SESSION_EXPIRES_MS);

    const response = NextResponse.json({ success: true, role: 'USER' });
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

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
