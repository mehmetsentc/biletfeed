import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { detectDeviceType } from '@/lib/analytics/device';
import { trackPageView } from '@/lib/services/site-tracking';
import { verifySessionCookie } from '@/lib/auth/session';

const bodySchema = z.object({
  path: z.string().trim().min(1).max(500),
  referrer: z.string().max(1000).optional().nullable(),
  utmSource: z.string().max(200).optional().nullable(),
  utmMedium: z.string().max(200).optional().nullable(),
  utmCampaign: z.string().max(200).optional().nullable(),
  sessionId: z.string().trim().min(8).max(128),
  width: z.number().int().positive().max(10000).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable()
});

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'track-pageview', 120, 60_000);
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz gövde' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const ua = request.headers.get('user-agent');
  const deviceType = detectDeviceType({
    userAgent: ua,
    width: parsed.data.width
  });

  let userId: string | null = null;
  try {
    const session = await verifySessionCookie();
    userId = session?.uid ?? null;
  } catch {
    userId = null;
  }

  try {
    await trackPageView({
      path: parsed.data.path,
      referrer: parsed.data.referrer,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
      userAgent: ua,
      deviceType,
      country: parsed.data.country,
      city: parsed.data.city,
      sessionId: parsed.data.sessionId,
      userId
    });
  } catch {
    // Tracking asla kullanıcı isteğini bozmasın
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  return NextResponse.json({ ok: true });
}
