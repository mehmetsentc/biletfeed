'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { formatEventDate } from '@/lib/data/mock-events';
import { eventStatusLabel } from '@/lib/organizator/status';
import type { EventStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface OrganizatorEventRow {
  id: string;
  slug: string;
  displayId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  ticketSold: number;
  ticketCapacity: number;
  venue: { name: string } | null;
  category: { name: string };
}

export function EventManagementTable({
  events,
  organizationName
}: {
  events: OrganizatorEventRow[];
  organizationName: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.displayId.toLowerCase().includes(q) ||
        e.venue?.name.toLowerCase().includes(q)
    );
  }, [events, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageEvents = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Etkinlik Yönetimi</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Bu sayfada etkinliklerinizi listeleyebilir, arama ve filtreleme
          yapabilir, detaylarını görüntüleyebilir, düzenleyebilir, iptal
          edebilir ve yeni etkinlik oluşturabilirsiniz.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/organizator-panel/etkinlikler"
          className={cn(
            'inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded border-2 border-[#f5a623] bg-white px-6 py-4 text-sm font-semibold text-zinc-800 shadow-sm sm:flex-none sm:min-w-[180px]'
          )}
        >
          <span className="text-lg">📁</span>
          Etkinlikler
        </Link>
        <Link
          href="/organizator-panel/etkinlik/yeni"
          className="inline-flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-6 py-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 sm:flex-none sm:min-w-[180px]"
        >
          <Plus className="size-5" />
          Yeni
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-700">
            {organizationName} Etkinlikleri
          </h2>
        </div>

        <div className="border-b border-zinc-200 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Arama filtreleri"
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Etkinlik ID</th>
                <th className="px-4 py-3 font-medium">Tür</th>
                <th className="px-4 py-3 font-medium">Etkinlik Adı</th>
                <th className="px-4 py-3 font-medium">Bilet Adedi</th>
                <th className="px-4 py-3 font-medium">Mekan Adı</th>
                <th className="px-4 py-3 font-medium">Başlangıç</th>
                <th className="px-4 py-3 font-medium">Bitiş</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {pageEvents.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {event.displayId}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">Normal</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    <Link
                      href={`/etkinlik/${event.slug}`}
                      className="hover:text-[#f5a623]"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {event.ticketSold}/{event.ticketCapacity || '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {event.venue?.name || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                    {formatEventDate(event.startDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                    {formatEventDate(event.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                      {eventStatusLabel(
                        event.status,
                        new Date(event.endDate)
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {pageEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Etkinlik bulunamadı.{' '}
                    <Link
                      href="/organizator-panel/etkinlik/yeni"
                      className="font-medium text-[#f5a623] hover:underline"
                    >
                      İlk etkinliğinizi oluşturun
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600">
          <span>
            {filtered.length} kayıt · sayfa {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
