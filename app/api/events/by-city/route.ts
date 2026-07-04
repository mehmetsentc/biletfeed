import { NextRequest, NextResponse } from 'next/server';
import { getPreferredCitySlug } from '@/lib/location/city-preference.server';
import {
  getHomeCityEventsBundle,
  resolveHomeCitySlug
} from '@/lib/services/home-city-events';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const limited = await rateLimitOrNullAsync(request, 'events-by-city', 60, 60_000);
  if (limited) return limited;

  const param = request.nextUrl.searchParams.get('sehir');
  const citySlug = param
    ? resolveHomeCitySlug(param)
    : await getPreferredCitySlug();

  const bundle = await getHomeCityEventsBundle(citySlug);
  return NextResponse.json(bundle);
}
