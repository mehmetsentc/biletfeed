import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  markAllNotificationsRead,
  markNotificationRead
} from '@/lib/services/notifications';
import { getNotificationsByUser } from '@/lib/services/tickets';

export async function GET() {
  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const notifications = await getNotificationsByUser(session.uid);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const body = (await request.json()) as { all?: boolean; id?: string };

  if (body.all) {
    await markAllNotificationsRead(session.uid);
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await markNotificationRead(body.id, session.uid);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
}
