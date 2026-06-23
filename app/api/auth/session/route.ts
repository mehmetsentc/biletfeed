import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { buildSignedSessionToken } from '@/lib/auth/session-crypto';
import {
  bootstrapRoleForEmail,
  isBootstrapSuperAdminEmail
} from '@/lib/auth/bootstrap-admins';
import { ROLES } from '@/lib/auth/roles';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

// lib/auth/session'dan import etmiyoruz — firebase-admin transitif bağımlılığını kırmak için
const SESSION_COOKIE_NAME = 'session';

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000; // 5 gün

function buildSimpleSession(
  uid: string,
  email: string,
  role: string,
  expiresMs: number
): string {
  return buildSignedSessionToken({
    uid,
    email,
    role,
    exp: Date.now() + expiresMs
  });
}

/** Firebase REST API ile ID token doğrular — Admin SDK gerekmez */
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

/** Kullanıcıyı DB'ye kaydet — bootstrap süperadmin + uid/e-posta eşleştirme */
async function syncUserToDB(uid: string, email: string): Promise<string> {
  if (!isDatabaseConfigured()) {
    return bootstrapRoleForEmail(email);
  }
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ firebaseUid: uid }, { email: normalizedEmail }]
      },
      select: { id: true, role: true, firebaseUid: true }
    });

    if (existing) {
      const role = isBootstrapSuperAdminEmail(normalizedEmail)
        ? ROLES.SUPER_ADMIN
        : existing.role;

      if (
        existing.firebaseUid !== uid ||
        (isBootstrapSuperAdminEmail(normalizedEmail) &&
          existing.role !== ROLES.SUPER_ADMIN)
      ) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            firebaseUid: uid,
            ...(isBootstrapSuperAdminEmail(normalizedEmail)
              ? { role: ROLES.SUPER_ADMIN }
              : {})
          }
        });
      }
      return role;
    }

    const role = bootstrapRoleForEmail(normalizedEmail);
    await prisma.user.create({
      data: {
        firebaseUid: uid,
        email: normalizedEmail,
        displayName: normalizedEmail.split('@')[0] || 'Kullanıcı',
        role
      }
    });
    return role;
  } catch {
    return bootstrapRoleForEmail(email);
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitOrNull(request, 'auth-session', 20, 60_000);
    if (limited) return limited;

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const body = (await request.json()) as { idToken?: string };
    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
    }

    const { uid, email } = await verifyIdTokenViaRestApi(idToken);
    const role = await syncUserToDB(uid, email);
    const sessionCookie = buildSimpleSession(uid, email, role, SESSION_EXPIRES_MS);

    const response = NextResponse.json({ success: true, role });
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
