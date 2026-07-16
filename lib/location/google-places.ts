import { SUPPORTED_CITIES, type CitySlug } from '@/lib/location/cities';

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  secondaryText: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  citySlug: CitySlug | null;
  cityName: string | null;
};

type AutocompletePrediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type AddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

function getApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || null;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getApiKey());
}

function normalizeCityToken(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/\s+ili$/i, '')
    .replace(/\s+province$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

const CITY_ALIASES: Record<string, CitySlug> = (() => {
  const map: Record<string, CitySlug> = {};
  for (const city of SUPPORTED_CITIES) {
    map[normalizeCityToken(city.name)] = city.slug;
    map[normalizeCityToken(city.slug)] = city.slug;
  }
  // Yaygın Google Places varyantları
  map[normalizeCityToken('İstanbul Province')] = 'istanbul';
  map[normalizeCityToken('Istanbul')] = 'istanbul';
  map[normalizeCityToken('Ankara Province')] = 'ankara';
  map[normalizeCityToken('Izmir')] = 'izmir';
  map[normalizeCityToken('Izmir Province')] = 'izmir';
  map[normalizeCityToken('Mugla')] = 'mugla';
  map[normalizeCityToken('Canakkale')] = 'canakkale';
  map[normalizeCityToken('Sanliurfa')] = 'sanliurfa';
  map[normalizeCityToken('Kahramanmaras')] = 'kahramanmaras';
  map[normalizeCityToken('Diyarbakir')] = 'diyarbakir';
  map[normalizeCityToken('Tekirdag')] = 'tekirdag';
  map[normalizeCityToken('Nevsehir')] = 'nevsehir';
  map[normalizeCityToken('Afyonkarahisar')] = 'afyon';
  return map;
})();

export function resolveCitySlugFromPlaceName(name: string | null | undefined): CitySlug | null {
  if (!name?.trim()) return null;
  return CITY_ALIASES[normalizeCityToken(name)] ?? null;
}

function pickCityFromComponents(components: AddressComponent[]): {
  citySlug: CitySlug | null;
  cityName: string | null;
} {
  const preferredTypes = [
    'administrative_area_level_1',
    'locality',
    'administrative_area_level_2'
  ];

  for (const type of preferredTypes) {
    const match = components.find((c) => c.types?.includes(type));
    const label = match?.long_name ?? match?.short_name ?? null;
    const slug = resolveCitySlugFromPlaceName(label);
    if (slug) {
      return {
        citySlug: slug,
        cityName: SUPPORTED_CITIES.find((c) => c.slug === slug)?.name ?? label
      };
    }
  }

  for (const component of components) {
    const label = component.long_name ?? component.short_name ?? null;
    const slug = resolveCitySlugFromPlaceName(label);
    if (slug) {
      return {
        citySlug: slug,
        cityName: SUPPORTED_CITIES.find((c) => c.slug === slug)?.name ?? label
      };
    }
  }

  return { citySlug: null, cityName: null };
}

export async function autocompletePlaces(input: {
  query: string;
  cityHint?: string;
}): Promise<PlaceSuggestion[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const query = input.query.trim();
  if (query.length < 2) return [];

  const searchInput = input.cityHint?.trim()
    ? `${query} ${input.cityHint.trim()}`
    : query;

  const params = new URLSearchParams({
    input: searchInput,
    key: apiKey,
    language: 'tr',
    components: 'country:tr'
  });

  const res = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Places autocomplete isteği başarısız');
  }

  const data = (await res.json()) as {
    status?: string;
    error_message?: string;
    predictions?: AutocompletePrediction[];
  };

  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status && data.status !== 'OK') {
    throw new Error(data.error_message || `Places hatası: ${data.status}`);
  }

  return (data.predictions ?? [])
    .filter((p): p is AutocompletePrediction & { place_id: string } => Boolean(p.place_id))
    .slice(0, 8)
    .map((p) => ({
      placeId: p.place_id,
      name: p.structured_formatting?.main_text?.trim() || p.description?.split(',')[0]?.trim() || 'Mekan',
      secondaryText: p.structured_formatting?.secondary_text?.trim() || '',
      description: p.description?.trim() || ''
    }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const id = placeId.trim();
  if (!id) return null;

  const params = new URLSearchParams({
    place_id: id,
    key: apiKey,
    language: 'tr',
    fields: 'place_id,name,formatted_address,address_component'
  });

  const res = await fetch(`${DETAILS_URL}?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('Places details isteği başarısız');
  }

  const data = (await res.json()) as {
    status?: string;
    error_message?: string;
    result?: {
      place_id?: string;
      name?: string;
      formatted_address?: string;
      address_components?: AddressComponent[];
    };
  };

  if (data.status && data.status !== 'OK') {
    throw new Error(data.error_message || `Places hatası: ${data.status}`);
  }

  const result = data.result;
  if (!result?.place_id) return null;

  const city = pickCityFromComponents(result.address_components ?? []);

  return {
    placeId: result.place_id,
    name: result.name?.trim() || 'Mekan',
    address: result.formatted_address?.trim() || '',
    citySlug: city.citySlug,
    cityName: city.cityName
  };
}
