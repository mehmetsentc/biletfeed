import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { getUserByFirebaseUid } from '@/lib/services/users';

export async function GET() {
  try {
    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await getUserByFirebaseUid(session.uid);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
