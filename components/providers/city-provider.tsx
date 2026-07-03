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
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  CityPickerDialog,
  type CityOption
} from '@/components/location/city-picker-dialog';
import {
  CITY_COOKIE_NAME,
  persistCityChoice,
  readStoredCitySlug
} from '@/lib/location/city-preference';
import { readCookieConsent } from '@/lib/cookies/consent';
import { detectCityFromGeolocation } from '@/lib/location/detect-city';
import { DEFAULT_CITY_SLUG, getCityNameOrDefault, isSupportedCitySlug } from '@/lib/location/cities';

type SetCityOptions = {
  /** Ana sayfada kalıp içeriği yenile */
  refreshOnly?: boolean;
};

type CityContextValue = {
  citySlug: string;
  cityName: string;
  cities: CityOption[];
  hasChosenCity: boolean;
  detectingLocation: boolean;
  openCityPicker: () => void;
  setCity: (slug: string, options?: SetCityOptions) => void;
};

const CityContext = createContext<CityContextValue | null>(null);

function readCookieCity(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CITY_COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split('=')[1] ?? '');
  return isSupportedCitySlug(value) ? value : null;
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [hasChosenCity, setHasChosenCity] = useState(Boolean(initialCitySlug));
  const [citySlug, setCitySlug] = useState(
    initialCitySlug ?? DEFAULT_CITY_SLUG
  );

  const applyCity = useCallback(
    (slug: string, options?: SetCityOptions) => {
      const resolvedSlug = isSupportedCitySlug(slug) ? slug : DEFAULT_CITY_SLUG;
      persistCityChoice(resolvedSlug);
      setCitySlug(resolvedSlug);
      setHasChosenCity(true);
      setPickerOpen(false);

      const stayOnPage = options?.refreshOnly || pathname === '/';
      if (stayOnPage) {
        router.refresh();
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('sehir', resolvedSlug);
      const targetPath = pathname.startsWith('/etkinlikler')
        ? pathname
        : '/etkinlikler';
      router.push(`${targetPath}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  /** Çerez onayı tamamlanana kadar şehir seçim dialogunu ertele */
  const openPickerAfterConsent = useCallback(() => {
    if (readCookieConsent() !== null) {
      // Zaten onay verilmiş — hemen aç
      setPickerOpen(true);
      return;
    }
    // Onay bekleniyor — event gelince aç
    const handleConsent = () => {
      setPickerOpen(true);
      window.removeEventListener('bf-cookie-consent-change', handleConsent);
    };
    window.addEventListener('bf-cookie-consent-change', handleConsent);
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredCitySlug();
    const fromCookie = readCookieCity();
    const resolved = stored ?? fromCookie ?? initialCitySlug;

    if (resolved) {
      if (!isSupportedCitySlug(resolved)) {
        setCitySlug(DEFAULT_CITY_SLUG);
        setHasChosenCity(false);
        openPickerAfterConsent();
        return;
      }
      setCitySlug(resolved);
      setHasChosenCity(true);
      if (!stored) persistCityChoice(resolved);
      return;
    }

    let cancelled = false;
    setDetectingLocation(true);

    detectCityFromGeolocation()
      .then((detected) => {
        if (cancelled) return;
        if (detected) {
          const safeSlug = isSupportedCitySlug(detected.slug)
            ? detected.slug
            : DEFAULT_CITY_SLUG;
          persistCityChoice(safeSlug);
          setCitySlug(safeSlug);
          setHasChosenCity(true);
          router.refresh();
          return;
        }
        openPickerAfterConsent();
      })
      .catch(() => {
        if (!cancelled) openPickerAfterConsent();
      })
      .finally(() => {
        if (!cancelled) setDetectingLocation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialCitySlug, router, openPickerAfterConsent]);

  const setCity = useCallback(
    (slug: string, options?: SetCityOptions) => {
      applyCity(slug, options);
    },
    [applyCity]
  );

  const openCityPicker = useCallback(() => setPickerOpen(true), []);

  const value = useMemo<CityContextValue>(
    () => ({
      citySlug,
      cityName: getCityNameOrDefault(citySlug),
      cities,
      hasChosenCity,
      detectingLocation,
      openCityPicker,
      setCity
    }),
    [
      citySlug,
      cities,
      hasChosenCity,
      detectingLocation,
      openCityPicker,
      setCity
    ]
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
