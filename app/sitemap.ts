import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { isDatabaseConfigured } from '@/lib/db/prisma';
import { prisma } from '@/lib/db/prisma';

const staticRoutes = [
  '',
  '/etkinlikler',
  '/kategoriler',
  '/sehirler',
  '/mekanlar',
  '/organizatorler',
  '/ara',
  '/hakkimizda',
  '/iletisim',
  '/sss',
  '/kosullar',
  '/gizlilik',
  '/yardim',
  '/kariyer'
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

  if (!isDatabaseConfigured()) {
    return staticEntries;
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
    return staticEntries;
  }
}
