import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { toggleFavoriteEvent, getFavoriteEventIds } from '@/lib/services/favorites';

const bodySchema = z.object({ eventId: z.string().uuid() });

/** GET /api/favorites — Returns list of favorited event IDs */
export async function GET() {
  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const ids = await getFavoriteEventIds(session.uid);
  return NextResponse.json({ ids: [...ids] });
}

/** POST /api/favorites — Toggle favorite for eventId */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz eventId' }, { status: 400 });
  }

  try {
    const result = await toggleFavoriteEvent(session.uid, parsed.data.eventId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
