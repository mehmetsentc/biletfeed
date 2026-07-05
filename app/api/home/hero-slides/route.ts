import { NextRequest, NextResponse } from 'next/server';
import { getHomeHeroSlides } from '@/lib/services/home-hero-slides';
import { resolveHomeCitySlug } from '@/lib/services/home-city-events';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const limited = await rateLimitOrNullAsync(request, 'home-hero-slides', 60, 60_000);
  if (limited) return limited;

  const param = request.nextUrl.searchParams.get('sehir');
  const citySlug = resolveHomeCitySlug(param);
  const slides = await getHomeHeroSlides(citySlug);

  return NextResponse.json({ slides, citySlug });
}
