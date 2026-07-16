import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  autocompletePlaces,
  isGooglePlacesConfigured
} from '@/lib/location/google-places';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

/**
 * GET /api/organizer/places/autocomplete?q=...&city=İstanbul
 * Google Places ile mekan önerileri (sunucu tarafı API key).
 */
export async function GET(request: NextRequest) {
  const limited = rateLimitOrNull(request, 'organizer-places-autocomplete', 40, 60_000);
  if (limited) return limited;

  const { error } = await requireOrganizerApi();
  if (error) return error;

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      { error: 'Google Places yapılandırılmamış', suggestions: [] },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const city = request.nextUrl.searchParams.get('city')?.trim() || undefined;

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await autocompletePlaces({ query: q, cityHint: city });
    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mekan araması başarısız';
    return NextResponse.json({ error: message, suggestions: [] }, { status: 502 });
  }
}
