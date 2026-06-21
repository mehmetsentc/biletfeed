import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { getCities } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Şehirler',
  path: '/sehirler'
});

export default async function CitiesPage() {
  const cities = await getCities();
  return (
    <>
      <PageHero
        title="Şehirler"
        subtitle="Türkiye genelinde etkinlikleri keşfedin"
      />
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/sehirler/${city.slug}`}
            prefetch
            className="group relative overflow-hidden rounded-2xl ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/30 hover:shadow-xl"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={city.image}
                alt={city.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h2 className="text-2xl font-bold">{city.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="size-4" strokeWidth={1.75} />
                  {city.count} etkinlik
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
