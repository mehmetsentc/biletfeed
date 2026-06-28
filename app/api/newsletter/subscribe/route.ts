import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { CITY_COOKIE_NAME } from '@/lib/location/city-preference.constants';
import { subscribeToNewsletter } from '@/lib/services/newsletter';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin'),
  source: z.string().trim().max(64).optional(),
  citySlug: z.string().trim().max(64).optional(),
});

function resolveCity(slug?: string | null) {
  if (!slug) return null;
  const city = SUPPORTED_CITIES.find((c) => c.slug === slug);
  return city ? { slug: city.slug, name: city.name } : null;
}

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

  const cookieCity = resolveCity(request.cookies.get(CITY_COOKIE_NAME)?.value);
  const bodyCity = resolveCity(parsed.data.citySlug);
  const city = bodyCity ?? cookieCity;

  try {
    const result = await subscribeToNewsletter(parsed.data.email, {
      source: parsed.data.source ?? 'homepage',
      citySlug: city?.slug ?? null,
      cityName: city?.name ?? null,
    });

    return NextResponse.json({
      ok: true,
      message: city
        ? `${city.name} etkinlikleri dahil bültenimize abone oldunuz.`
        : 'Bültenimize abone oldunuz.',
      created: result.created,
      emailSent: result.emailSent,
      citySlug: result.citySlug,
      cityName: result.cityName,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Abonelik kaydedilemedi' },
      { status: 500 }
    );
  }
}
