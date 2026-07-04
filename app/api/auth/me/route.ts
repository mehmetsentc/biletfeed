import { NextResponse } from 'next/server';
import {
  verifySessionCookie,
} from '@/lib/auth/session';
import { attachSharedSessionCookie } from '@/lib/auth/session-cookie-refresh';
import { getUserProfileByFirebaseUid } from '@/lib/services/user-queries';

export async function GET() {
  try {
    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getUserProfileByFirebaseUid(session.uid);

    const payload = user
      ? { user }
      : {
          user: {
            uid: session.uid,
            email: session.email || '',
            displayName: session.email?.split('@')[0] || 'Kullanıcı',
            role: session.role,
            favorites: [],
            following: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

    const response = NextResponse.json(payload);
    return attachSharedSessionCookie(response, session);
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
