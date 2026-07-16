import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  getPlaceDetails,
  isGooglePlacesConfigured
} from '@/lib/location/google-places';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

/**
 * GET /api/organizer/places/details?placeId=...
 * Seçilen mekanın adresi ve şehir bilgisini döner.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'organizer-places-details', 30, 60_000);
  if (limited) return limited;

  const { error } = await requireOrganizerApi();
  if (error) return error;

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ error: 'Google Places yapılandırılmamış' }, { status: 503 });
  }

  const placeId = request.nextUrl.searchParams.get('placeId')?.trim() ?? '';
  if (!placeId) {
    return NextResponse.json({ error: 'placeId gerekli' }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(placeId);
    if (!place) {
      return NextResponse.json({ error: 'Mekan bulunamadı' }, { status: 404 });
    }
    return NextResponse.json({ place });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mekan detayı alınamadı';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
