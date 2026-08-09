import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { recordFeedCtaClick } from '@/lib/services/feed';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

type Params = { params: Promise<{ id: string }> };

const idSchema = z.string().uuid();

export async function POST(request: NextRequest, { params }: Params) {
  const limited = rateLimitOrNull(request, 'feed-cta', 120, 60_000);
  if (limited) return limited;
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 });
  }

  await recordFeedCtaClick(id);
  return NextResponse.json({ success: true });
}
