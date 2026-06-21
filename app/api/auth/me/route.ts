import { NextResponse } from 'next/server';
import { getAdminAuth, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { getUserByFirebaseUid } from '@/lib/services/users';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function GET() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ user: null }, { status: 503 });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const user = await getUserByFirebaseUid(decoded.uid);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
