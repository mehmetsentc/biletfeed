import { NextResponse } from 'next/server';
import { verifyPanelSessionCookie } from '@/lib/auth/session';
import { getUserProfileByFirebaseUid } from '@/lib/services/user-queries';

export async function GET() {
  try {
    const session = await verifyPanelSessionCookie();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getUserProfileByFirebaseUid(session.uid, session.email);

    if (!user) {
      return NextResponse.json({
        user: {
          uid: session.uid,
          email: session.email || '',
          displayName: session.email?.split('@')[0] || 'Organizatör',
          role: session.role,
          favorites: [],
          following: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
