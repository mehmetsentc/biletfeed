import { NextResponse } from 'next/server';
import {
  verifySessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_MS
} from '@/lib/auth/session';
import { getUserProfileByFirebaseUid } from '@/lib/services/user-queries';

export async function GET() {
  try {
    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getUserProfileByFirebaseUid(session.uid);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
