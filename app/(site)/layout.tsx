import { Footer } from '@/components/layout/footer';
import { MobileFooter } from '@/components/layout/mobile/mobile-footer';
import { SiteChrome } from '@/components/layout/site-chrome';
import { CityProvider } from '@/components/providers/city-provider';
import { CITY_COOKIE_NAME } from '@/lib/location/city-preference';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { getCitiesWithEvents } from '@/lib/services/events';
import { cookies } from 'next/headers';

export default async function SiteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [cities, cookieStore] = await Promise.all([
    getCitiesWithEvents(),
    cookies()
  ]);
  const cookieSlug = cookieStore.get(CITY_COOKIE_NAME)?.value;
  const initialCitySlug =
    cookieSlug && SUPPORTED_CITIES.some((c) => c.slug === cookieSlug)
      ? cookieSlug
      : null;

  return (
    <CityProvider cities={cities} initialCitySlug={initialCitySlug ?? null}>
      <SiteChrome footer={<Footer />} mobileFooter={<MobileFooter />}>
        {children}
      </SiteChrome>
    </CityProvider>
  );
}
