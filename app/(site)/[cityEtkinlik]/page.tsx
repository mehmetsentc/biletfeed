import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { getCitySeoContent } from '@/lib/seo/city-seo-content';
import { getEventsByCity, getCategories } from '@/lib/services/events';
import { siteConfig } from '@/lib/config/site';
import EventsPageClient from '@/app/(site)/etkinlikler/events-client';
import { CityEventsSeoSection } from '@/components/seo/city-events-seo-section';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ cityEtkinlik: string }>;
}

/** "istanbul-etkinlikleri" → "istanbul" */
function parseCitySlug(param: string): string | null {
  if (param.endsWith('-etkinlikleri')) {
    return param.slice(0, -'-etkinlikleri'.length);
  }
  return null;
}

function getCityByParam(param: string) {
  const slug = parseCitySlug(decodeURIComponent(param));
  if (!slug) return null;
  return SUPPORTED_CITIES.find((c) => c.slug === slug) ?? null;
}

export async function generateStaticParams() {
  return SUPPORTED_CITIES.map((city) => ({
    cityEtkinlik: `${city.slug}-etkinlikleri`
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityEtkinlik } = await params;
  const city = getCityByParam(cityEtkinlik);
  if (!city) return { title: 'Sayfa Bulunamadı' };

  const title = `${city.name} Etkinlikleri`;
  const seo = getCitySeoContent(city.slug);
  // Cümle ortasında kesmemek için tam intro kullan (Google 160+ karakteri de kabul eder)
  const description = seo.intro;
  const url = `${siteConfig.url}/${cityEtkinlik}`;

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: 'tr_TR',
      type: 'website',
      images: [
        {
          url: `${siteConfig.url}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  };
}

function CityPageLoading({ cityName }: { cityName: string }) {
  return (
    <div className="min-h-screen bg-ticket-page">
      <div className="border-b border-white/10 px-4 py-8">
        <Skeleton className="h-8 w-64 bg-card/10" />
        <Skeleton className="mt-3 h-4 w-80 bg-card/10" />
        <Skeleton className="mt-5 h-12 w-full rounded-xl bg-card/10" />
      </div>
      <div className="container mx-auto grid gap-5 px-4 py-8 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-xl bg-card/10" />
        ))}
      </div>
    </div>
  );
}

export const revalidate = 300;

export default async function CityEventsPage({ params }: Props) {
  const { cityEtkinlik } = await params;
  const city = getCityByParam(cityEtkinlik);
  if (!city) notFound();

  const [events, categories] = await Promise.all([
    getEventsByCity(city.slug),
    getCategories()
  ]);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: siteConfig.url
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Etkinlikler',
        item: `${siteConfig.url}/etkinlikler`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${city.name} Etkinlikleri`,
        item: `${siteConfig.url}/${cityEtkinlik}`
      }
    ]
  };

  const eventListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${city.name} Etkinlikleri`,
    description: `${city.name} şehrindeki yaklaşan etkinlikler`,
    numberOfItems: events.length,
    itemListElement: events.slice(0, 10).map((event, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Event',
        name: event.title,
        description: event.shortDescription || event.description,
        startDate: event.startDate,
        url: `${siteConfig.url}/etkinlik/${event.slug}`,
        image: event.coverImage,
        location: {
          '@type': 'Place',
          name: event.venue,
          address: {
            '@type': 'PostalAddress',
            addressLocality: city.name,
            addressCountry: 'TR'
          }
        }
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListJsonLd) }}
      />
      <h1 className="sr-only">{city.name} Etkinlikleri — Konser, Festival ve Daha Fazlası</h1>
      <Suspense fallback={<CityPageLoading cityName={city.name} />}>
        <EventsPageClient
          events={events}
          categories={categories}
          fixedCitySlug={city.slug}
        />
      </Suspense>
      <CityEventsSeoSection citySlug={city.slug} />
    </>
  );
}
