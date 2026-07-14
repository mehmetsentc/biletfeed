import { notFound } from 'next/navigation';
import { CategoryIcon } from '@/components/categories/category-icon';
import { PageHero } from '@/components/layout/page-hero';
import { EventCard } from '@/components/events/event-card';
import { getEventsByCategory, getCategories } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getPreferredCitySlug } from '@/lib/location/city-preference.server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  const name = cat?.name || 'Kategori';
  return createPageMetadata({
    title: name,
    description: `Türkiye genelindeki ${name.toLowerCase()} etkinliklerini keşfedin ve bilet alın. Bilet Feed ile en güncel ${name.toLowerCase()} etkinliklerini takip edin.`,
    path: `/kategoriler/${slug}`,
    keywords: [name.toLowerCase(), `${name.toLowerCase()} bilet`, `${name.toLowerCase()} etkinlik`, 'bilet al']
  });
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const citySlug = await getPreferredCitySlug();
  const events = await getEventsByCategory(slug, citySlug);

  return (
    <>
      <PageHero
        leading={<CategoryIcon slug={category.slug} size="xl" showRing={false} />}
        title={category.name}
        subtitle={`${events.length} etkinlik`}
        breadcrumbs={[
          { label: 'Kategoriler', href: '/kategoriler' },
          { label: category.name }
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Bu kategoride henüz etkinlik yok.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
