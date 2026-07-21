import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { trackNotFound } from '@/lib/services/site-tracking';

const bodySchema = z.object({
  path: z.string().trim().min(1).max(500),
  referrer: z.string().max(1000).optional().nullable()
});

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'track-404', 60, 60_000);
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
    await trackNotFound({
      path: parsed.data.path,
      referrer: parsed.data.referrer
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  return NextResponse.json({ ok: true });
}
