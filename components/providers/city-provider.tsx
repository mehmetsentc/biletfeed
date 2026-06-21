'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import {
  CityPickerDialog,
  type CityOption
} from '@/components/location/city-picker-dialog';
import {
  CITY_COOKIE_NAME,
  persistCityChoice,
  readStoredCitySlug
} from '@/lib/location/city-preference';
import { DEFAULT_CITY_SLUG, getCityBySlug } from '@/lib/location/cities';

type CityContextValue = {
  citySlug: string;
  cityName: string;
  cities: CityOption[];
  hasChosenCity: boolean;
  openCityPicker: () => void;
  setCity: (slug: string) => void;
};

const CityContext = createContext<CityContextValue | null>(null);

function readCookieCity(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CITY_COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split('=')[1] ?? '');
  return getCityBySlug(value) ? value : null;
}

interface CityProviderProps {
  children: ReactNode;
  cities: CityOption[];
  initialCitySlug?: string | null;
}

export function CityProvider({
  children,
  cities,
  initialCitySlug
}: CityProviderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hasChosenCity, setHasChosenCity] = useState(Boolean(initialCitySlug));
  const [citySlug, setCitySlug] = useState(
    initialCitySlug ?? DEFAULT_CITY_SLUG
  );

  useEffect(() => {
    setMounted(true);
    const stored = readStoredCitySlug();
    const fromCookie = readCookieCity();
    const resolved = stored ?? fromCookie ?? initialCitySlug;

    if (resolved) {
      setCitySlug(resolved);
      setHasChosenCity(true);
      if (!stored) persistCityChoice(resolved);
      return;
    }

    setPickerOpen(true);
  }, [initialCitySlug]);

  const setCity = useCallback(
    (slug: string) => {
      const city = getCityBySlug(slug);
      persistCityChoice(city.slug);
      setCitySlug(city.slug);
      setHasChosenCity(true);
      setPickerOpen(false);
      router.refresh();
    },
    [router]
  );

  const openCityPicker = useCallback(() => setPickerOpen(true), []);

  const value = useMemo<CityContextValue>(
    () => ({
      citySlug,
      cityName: getCityBySlug(citySlug).name,
      cities,
      hasChosenCity,
      openCityPicker,
      setCity
    }),
    [citySlug, cities, hasChosenCity, openCityPicker, setCity]
  );

  return (
    <CityContext.Provider value={value}>
      {children}
      {mounted && (
        <CityPickerDialog
          open={pickerOpen}
          cities={cities}
          selectedSlug={citySlug}
          onSelect={setCity}
          required={!hasChosenCity}
          onOpenChange={setPickerOpen}
        />
      )}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error('useCity must be used within CityProvider');
  }
  return ctx;
}

/** Site chrome dışında kullanım için — provider yoksa null döner */
export function useCityOptional() {
  return useContext(CityContext);
}
