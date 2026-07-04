import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-api';

export const dynamic = 'force-dynamic';

/** Sunucu auth yapılandırması — production'da minimal yanıt */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ ok: true });
    }
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const expectedAuthDomain = projectId ? `${projectId}.firebaseapp.com` : null;

  const firebaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() && projectId
  );
  const sessionSecretConfigured = Boolean(process.env.NEXTAUTH_SECRET?.trim());
  const authDomainMismatch = Boolean(
    expectedAuthDomain && authDomain && authDomain !== expectedAuthDomain
  );

  const issues: string[] = [];
  if (!firebaseConfigured) issues.push('Firebase client env eksik');
  if (!sessionSecretConfigured) issues.push('NEXTAUTH_SECRET eksik');
  if (authDomainMismatch) {
    issues.push(
      `authDomain ${authDomain} yerine ${expectedAuthDomain} kullanılmalı`
    );
  }

  return NextResponse.json({
    ok: issues.length === 0,
    firebaseConfigured,
    sessionSecretConfigured,
    authDomain: authDomain || null,
    authDomainRecommended: expectedAuthDomain,
    authDomainMismatch,
    issues
  });
}
