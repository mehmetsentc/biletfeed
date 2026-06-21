import Link from 'next/link';
import Image from 'next/image';
import { formatEventDate, formatEventTimeRange } from '@/lib/data/mock-events';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function AdminEventsPage({
  searchParams
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const { review } = await searchParams;
  await ensureDbConnection();

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: 'external',
      ...(review === '1'
        ? {
            OR: [
              { tags: { has: 'eksik-gorsel' } },
              { tags: { has: 'eksik-aciklama' } }
            ]
          }
        : {})
    },
    include: eventInclude,
    orderBy: [{ startDate: 'asc' }],
    take: 200
  });

  const rows = events.map(toMockEvent);
  const needsReview = rows.filter(
    (e) =>
      e.tags.includes('eksik-gorsel') ||
      e.tags.includes('eksik-aciklama') ||
      e.coverImage.includes('favicon')
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Etkinlik Editörü</h1>
          <p className="text-sm text-muted-foreground">
            Scraper kaynaklı etkinlikleri düzenleyin. Toplam {rows.length} etkinlik
            {needsReview > 0 && ` · ${needsReview} inceleme bekliyor`}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/etkinlikler">Tümü</Link>
          </Button>
          <Button variant={review === '1' ? 'default' : 'outline'} asChild>
            <Link href="/admin/etkinlikler?review=1">Eksik bilgi</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tarih / Saat</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Kaynak</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} className="border-b last:border-0">
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
                <td className="p-3">{event.city}</td>
                <td className="p-3">{event.externalPlatform || '—'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {event.tags.includes('eksik-gorsel') && (
                      <Badge variant="destructive">Görsel eksik</Badge>
                    )}
                    {event.tags.includes('eksik-aciklama') && (
                      <Badge variant="secondary">Açıklama eksik</Badge>
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
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Henüz scraper etkinliği yok. Scrape job çalıştırın.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
