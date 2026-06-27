import type { MetadataRoute } from 'next';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { siteConfig } from '@/lib/config/site';
import { isDatabaseConfigured } from '@/lib/db/prisma';
import { prisma } from '@/lib/db/prisma';
import { getCategories, getCities } from '@/lib/services/events';

const staticRoutes = [
  '',
  '/etkinlikler',
  '/kategoriler',
  '/sehirler',
  '/mekanlar',
  '/organizatorler',
  '/hakkimizda',
  '/iletisim',
  '/sss',
  '/kosullar',
  '/gizlilik',
  '/cerezler',
  '/iade-iptal',
  '/mesafeli-satis',
  '/yardim',
  '/kariyer',
  '/eventjoy'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8
  }));

  const cityEventPages: MetadataRoute.Sitemap = SUPPORTED_CITIES.map((city) => ({
    url: `${baseUrl}/${city.slug}-etkinlikleri`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85
  }));

  const [categories, cities] = await Promise.all([
    getCategories(),
    getCities()
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/kategoriler/${category.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75
  }));

  const cityEntries: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/sehirler/${city.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.75
  }));

  const catalogEntries = [
    ...cityEventPages,
    ...categoryEntries,
    ...cityEntries
  ];

  if (!isDatabaseConfigured()) {
    return [...staticEntries, ...catalogEntries];
  }

  try {
    const [events, organizers] = await Promise.all([
      prisma.event.findMany({
        where: { status: 'published', deletedAt: null, startDate: { gte: now } },
        select: { slug: true, updatedAt: true }
      }),
      prisma.organizer.findMany({
        where: { deletedAt: null, status: 'approved' },
        select: { slug: true, updatedAt: true }
      })
    ]);

    return [
      ...staticEntries,
      ...catalogEntries,
      ...events.map((e) => ({
        url: `${baseUrl}/etkinlik/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9
      })),
      ...organizers.map((o) => ({
        url: `${baseUrl}/organizator/${o.slug}`,
        lastModified: o.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }))
    ];
  } catch {
    return [...staticEntries, ...catalogEntries];
  }
}
