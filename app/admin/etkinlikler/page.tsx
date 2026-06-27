import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import type { Prisma } from '@prisma/client';
import { formatEventDate, formatEventTimeRange } from '@/lib/data/mock-events';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrapeNowButton } from '@/components/admin/scrape-now-button';
import { EventFilters } from '@/components/admin/event-filters';

export default async function AdminEventsPage({
  searchParams
}: {
  searchParams: Promise<{ review?: string; kategori?: string; sehir?: string; tarih?: string }>;
}) {
  const { review, kategori, sehir, tarih } = await searchParams;
  await ensureDbConnection();

  // Filtre koşulları
  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    listingType: 'external',
    ...(review === '1' ? {
      OR: [
        { tags: { has: 'eksik-gorsel' } },
        { tags: { has: 'eksik-aciklama' } }
      ]
    } : {}),
    ...(kategori ? { category: { slug: kategori } } : {}),
    ...(sehir ? { city: { slug: sehir } } : {}),
    ...(tarih ? { startDate: { gte: new Date(tarih) } } : {}),
  };

  const [events, allCities] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: [{ startDate: 'asc' }],
      take: 300
    }),
    prisma.city.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true }
    })
  ]);

  const rows = events.map(toMockEvent);
  const needsReview = rows.filter(
    (e) =>
      e.tags.includes('eksik-gorsel') ||
      e.tags.includes('eksik-aciklama') ||
      e.coverImage.includes('favicon')
  ).length;

  const cityNames = allCities.map((c) => c.slug);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Etkinlik Editörü</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} etkinlik gösteriliyor
            {needsReview > 0 && ` · ${needsReview} inceleme bekliyor`}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/etkinlikler">Tümü</Link>
          </Button>
          <Button variant={review === '1' ? 'default' : 'outline'} asChild>
            <Link href="/admin/etkinlikler?review=1">Eksik bilgi</Link>
          </Button>
          <ScrapeNowButton />
        </div>
      </div>

      <Suspense>
        <EventFilters cities={cityNames} />
      </Suspense>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tarih / Saat</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Kaynak</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                      {event.coverImage && (
                        <Image
                          src={event.coverImage}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <span className="font-medium line-clamp-2">{event.title}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {formatEventDate(event.startDate)}
                  <br />
                  {formatEventTimeRange(event)}
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {event.categorySlug || '—'}
                  </span>
                </td>
                <td className="p-3 text-sm">{event.city}</td>
                <td className="p-3 text-xs text-muted-foreground">{event.externalPlatform || '—'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {event.tags.includes('eksik-gorsel') && (
                      <Badge variant="destructive" className="text-xs">Görsel</Badge>
                    )}
                    {event.tags.includes('eksik-aciklama') && (
                      <Badge variant="secondary" className="text-xs">Açıklama</Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/etkinlikler/${event.id}`}>Düzenle</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Filtrele uyan etkinlik yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
