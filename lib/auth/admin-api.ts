import { NextResponse } from 'next/server';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';

export async function requireAdminSession() {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ADMIN')) {
    return null;
  }
  return session;
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
}
