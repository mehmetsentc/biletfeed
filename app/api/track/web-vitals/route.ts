import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { trackWebVital } from '@/lib/services/site-tracking';

const bodySchema = z.object({
  path: z.string().trim().min(1).max(500),
  metric: z.enum(['LCP', 'INP', 'CLS', 'TTFB']),
  value: z.number().finite(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).transform((r) =>
    r === 'needs-improvement' ? 'needs_improvement' : r
  ),
  sessionId: z.string().trim().min(8).max(128).optional().nullable()
});

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'track-web-vitals', 60, 60_000);
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

  try {
    await trackWebVital({
      path: parsed.data.path,
      metric: parsed.data.metric,
      value: parsed.data.value,
      rating: parsed.data.rating,
      sessionId: parsed.data.sessionId
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  return NextResponse.json({ ok: true });
}
