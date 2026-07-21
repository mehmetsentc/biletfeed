import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { trackSiteSearch } from '@/lib/services/site-tracking';
import { verifySessionCookie } from '@/lib/auth/session';

const bodySchema = z.object({
  query: z.string().trim().min(1).max(200),
  resultCount: z.number().int().min(0).max(100_000).optional().default(0)
});

export async function POST(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'track-search', 60, 60_000);
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

  let userId: string | null = null;
  try {
    const session = await verifySessionCookie();
    userId = session?.uid ?? null;
  } catch {
    userId = null;
  }

  try {
    await trackSiteSearch({
      query: parsed.data.query,
      resultCount: parsed.data.resultCount,
      userId
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  return NextResponse.json({ ok: true });
}
