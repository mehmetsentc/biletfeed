import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import {
  getUserNotificationPreferences,
  resolveCitySlugFromCookieHeader,
  updateUserNotificationPreferences
} from '@/lib/services/notification-preferences';

const patchSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  newsletter: z.boolean().optional(),
  subscribeNewsletter: z.boolean().optional()
});

export async function GET() {
  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const prefs = await getUserNotificationPreferences(session.uid);
  if (!prefs) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }
  return NextResponse.json({ prefs });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const session = await verifySessionCookie();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const limited = rateLimitOrNull(
    request,
    `notif-prefs:${session.uid}`,
    30,
    60_000
  );
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz tercihler' }, { status: 400 });
  }

  try {
    const prefs = await updateUserNotificationPreferences(
      session.uid,
      {
        email: parsed.data.email,
        sms: parsed.data.sms,
        push: parsed.data.push,
        newsletter: parsed.data.newsletter
      },
      {
        subscribeNewsletter: parsed.data.subscribeNewsletter,
        citySlug: resolveCitySlugFromCookieHeader(
          request.headers.get('cookie')
        )
      }
    );
    return NextResponse.json({ ok: true, prefs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Kaydedilemedi' },
      { status: 500 }
    );
  }
}
