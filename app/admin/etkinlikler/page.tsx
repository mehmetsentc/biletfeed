import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { formatEventDate, formatEventTimeRange } from '@/lib/data/mock-events';
import {
  adminEventEditorHasActiveFilter,
  listAdminEditorEvents
} from '@/lib/services/admin-events';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventFilters } from '@/components/admin/event-filters';
import { CancelEventButton } from '@/components/admin/cancel-event-button';

export default async function AdminEventsPage({
  searchParams
}: {
  searchParams: Promise<{
    kategori?: string;
    sehir?: string;
    tarih?: string;
    q?: string;
  }>;
}) {
  const { kategori, sehir, tarih, q } = await searchParams;

  const filterInput = {
    kategori: kategori || undefined,
    sehir: sehir || undefined,
    tarih: tarih || undefined,
    q: q || undefined
  };

  const searching = adminEventEditorHasActiveFilter(filterInput);

  const { rows, cities } = await listAdminEditorEvents({
    ...filterInput,
    upcomingOnly: !searching
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Etkinlikleri Düzenle</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} etkinlik · güncelle ve kaydet
            {searching ? ' · arama sonucu (geçmiş dahil)' : ' · yaklaşan'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/etkinlikler">Yaklaşanlar</Link>
        </Button>
      </div>

      <Suspense>
        <EventFilters cities={cities} />
      </Suspense>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tarih / Saat</th>
              <th className="p-3 font-medium">Kategori</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Organizatör</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => {
              const upcoming = isUpcomingEvent(event);
              return (
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
                      <div className="min-w-0">
                        <span className="font-medium line-clamp-2">{event.title}</span>
                        <a
                          href={`/etkinlik/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Sitede gör
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {formatEventDate(event.startDate)}
                    <br />
                    {formatEventTimeRange(event)}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {event.category || event.categorySlug || '—'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{event.city}</td>
                  <td className="p-3 text-xs text-muted-foreground">{event.organizer}</td>
                  <td className="p-3">
                    {event.status === 'cancelled' ? (
                      <Badge variant="destructive" className="text-xs">İptal</Badge>
                    ) : upcoming ? (
                      <Badge variant="success" className="text-xs">Yayında</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Geçmiş</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/etkinlikler/${event.id}`}>Düzenle</Link>
                      </Button>
                      {event.status !== 'cancelled' && (
                        <CancelEventButton eventId={event.id} eventTitle={event.title} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <p>
                    {searching
                      ? 'Arama kriterlerine uyan etkinlik bulunamadı.'
                      : 'Yaklaşan onaylı etkinlik yok.'}
                  </p>
                  {!searching && (
                    <p className="mt-2 text-xs">
                      Onay bekleyenler için{' '}
                      <Link href="/admin/etkinlik-onay" className="text-primary hover:underline">
                        Etkinlik Onay
                      </Link>
                      {' · '}Geçmiş etkinlikler için kategori veya arama kullanın
                    </p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
