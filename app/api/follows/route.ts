import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  getFollowedOrganizerIds,
  getFollowedVenueIds,
  toggleFollow
} from '@/lib/services/follows';

const bodySchema = z.object({
  type: z.enum(['organizer', 'venue']),
  targetId: z.string().uuid()
});

/** GET /api/follows — Returns followed organizer and venue IDs */
export async function GET() {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const [organizerIds, venueIds] = await Promise.all([
    getFollowedOrganizerIds(session.uid),
    getFollowedVenueIds(session.uid)
  ]);

  return NextResponse.json({
    organizerIds: [...organizerIds],
    venueIds: [...venueIds]
  });
}

/** POST /api/follows — Toggle follow for organizer or venue */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  try {
    const result = await toggleFollow(
      session.uid,
      parsed.data.type,
      parsed.data.targetId
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
