import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { subscribeToNewsletter } from '@/lib/services/newsletter';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
  source: z.string().trim().max(64).optional(),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const limited = rateLimitOrNull(request, 'newsletter-subscribe', 8, 60_000);
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz e-posta' },
      { status: 400 }
    );
  }

  try {
    const result = await subscribeToNewsletter(
      parsed.data.email,
      parsed.data.source ?? 'homepage'
    );

    return NextResponse.json({
      ok: true,
      message: 'Bültenimize abone oldunuz.',
      created: result.created,
      emailSent: result.emailSent,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Abonelik kaydedilemedi' },
      { status: 500 }
    );
  }
}
