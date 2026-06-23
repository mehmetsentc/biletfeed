import { NextRequest, NextResponse } from 'next/server';
import { getPreferredCitySlug } from '@/lib/location/city-preference.server';
import {
  getHomeCityEventsBundle,
  resolveHomeCitySlug
} from '@/lib/services/home-city-events';

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('sehir');
  const citySlug = param
    ? resolveHomeCitySlug(param)
    : await getPreferredCitySlug();

  const bundle = await getHomeCityEventsBundle(citySlug);
  return NextResponse.json(bundle);
}
