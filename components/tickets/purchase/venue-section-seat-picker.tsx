'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, Ticket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import { ticketTypeAvailable } from '@/lib/tickets/purchase-types';
import { formatTry } from '@/lib/tickets/purchase-pricing';
import { matchTicketTypeToSeatUnit } from '@/lib/tickets/seat-packages';
import type { SeatPlan, SeatPlanUnit, SeatPlanZone } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

const MAX_SEATS = 10;

type Props = {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  seatPlan: SeatPlan;
};

type SeatCell = {
  unit: SeatPlanUnit;
  zone: SeatPlanZone;
  ticket?: CheckoutTicketType;
  available: boolean;
};

function zoneAccent(zone: SeatPlanZone, index: number): string {
  if (zone.color) return zone.color;
  const palette = ['#00897b', '#e53935', '#1e88e5', '#ec407a', '#4caf50', '#f5c518'];
  return palette[index % palette.length]!;
}

export function VenueSectionSeatPicker({ eventSlug, ticketTypes, seatPlan }: Props) {
  const router = useRouter();
  const zones = seatPlan.zones ?? [];
  const [showMap, setShowMap] = useState(Boolean(seatPlan.mapImageUrl));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const cellsByZone = useMemo(() => {
    const map = new Map<string, SeatCell[]>();
    zones.forEach((zone) => {
      const cells = zone.units.map((unit) => {
        const ticket = matchTicketTypeToSeatUnit(
          unit.id,
          unit.ticketTypeHint,
          ticketTypes
        );
        return {
          unit,
          zone,
          ticket,
          available: ticket ? ticketTypeAvailable(ticket) : false
        };
      });
      map.set(zone.code, cells);
    });
    return map;
  }, [zones, ticketTypes]);

  const selectedSeats = useMemo(() => {
    const all = zones.flatMap((z) => cellsByZone.get(z.code) ?? []);
    return selectedIds
      .map((id) => all.find((c) => c.unit.id === id))
      .filter((c): c is SeatCell => Boolean(c?.ticket));
  }, [selectedIds, zones, cellsByZone]);

  const total = selectedSeats.reduce((sum, s) => sum + (s.ticket?.price ?? 0), 0);

  function toggleSeat(cell: SeatCell) {
    if (!cell.ticket || !cell.available) return;
    setSelectedIds((prev) => {
      if (prev.includes(cell.unit.id)) {
        return prev.filter((id) => id !== cell.unit.id);
      }
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, cell.unit.id];
    });
  }

  function goCheckout() {
    const ids = selectedSeats
      .map((s) => s.ticket?.id)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return;
    if (ids.length === 1) {
      router.push(`/etkinlik/${eventSlug}/bilet/${ids[0]}/odeme?adet=1`);
      return;
    }
    router.push(
      `/etkinlik/${eventSlug}/bilet/koltuklar/odeme?ids=${ids.join(',')}`
    );
  }

  if (zones.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Krokiden koltuk seçin. Seçili koltuklar yeşil, dolu koltuklar gri görünür.
        </p>
        {seatPlan.mapImageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowMap((v) => !v)}
          >
            <MapIcon className="size-3.5" />
            {showMap ? 'Haritayı gizle' : 'Oturma planı'}
          </Button>
        )}
      </div>

      {showMap && seatPlan.mapImageUrl && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[16/10] w-full bg-muted">
            <Image
              src={seatPlan.mapImageUrl}
              alt="Oturma planı"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
          {seatPlan.notes && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {seatPlan.notes}
            </p>
          )}
        </div>
      )}

      {/* Interactive amphitheater-style seat map */}
      <div className="rounded-2xl border border-border bg-gradient-to-b from-zinc-50 to-white p-4 dark:from-zinc-950 dark:to-zinc-900 sm:p-6">
        <div className="mx-auto mb-6 flex max-w-md flex-col items-center">
          <div className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-center text-xs font-bold tracking-[0.2em] text-white">
            SAHNE
          </div>
          <div className="mt-1 h-0 w-0 border-l-[12px] border-r-[12px] border-t-[10px] border-l-transparent border-r-transparent border-t-zinc-800/40" />
        </div>

        <div className="space-y-5">
          {zones.map((zone, zoneIndex) => {
            const cells = cellsByZone.get(zone.code) ?? [];
            const accent = zoneAccent(zone, zoneIndex);
            return (
              <section key={zone.code} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    {zone.label}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {cells.filter((c) => c.available).length}/{cells.length} müsait
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {cells.map((cell) => {
                    const selected = selectedIds.includes(cell.unit.id);
                    const sold = Boolean(cell.ticket) && !cell.available;
                    const unbound = !cell.ticket;

                    return (
                      <button
                        key={cell.unit.id}
                        type="button"
                        disabled={sold || unbound}
                        title={
                          unbound
                            ? `${cell.unit.label} — tanımlı değil`
                            : sold
                              ? `${cell.unit.label} — Dolu`
                              : `${cell.unit.label} · ${formatTry(cell.ticket!.price)}`
                        }
                        onClick={() => toggleSeat(cell)}
                        className={cn(
                          'relative flex size-9 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:size-10 sm:text-[11px]',
                          unbound &&
                            'cursor-not-allowed border border-dashed border-border text-muted-foreground',
                          sold &&
                            'cursor-not-allowed bg-zinc-200 text-zinc-400 line-through dark:bg-zinc-800 dark:text-zinc-600',
                          !sold &&
                            !unbound &&
                            !selected &&
                            'border-2 text-white shadow-sm hover:scale-105 hover:brightness-110',
                          selected &&
                            'scale-105 border-2 border-emerald-700 bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300'
                        )}
                        style={
                          !sold && !unbound && !selected
                            ? {
                                backgroundColor: accent,
                                borderColor: accent
                              }
                            : undefined
                        }
                      >
                        {cell.unit.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
          <LegendDot className="bg-[#00897b]" label="Müsait" />
          <LegendDot className="bg-emerald-500 ring-2 ring-emerald-300" label="Seçili" />
          <LegendDot className="bg-zinc-200 dark:bg-zinc-800" label="Dolu" />
        </div>
      </div>

      {/* Selection cart */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {selectedSeats.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Henüz koltuk seçilmedi
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="flex max-h-28 flex-col gap-1.5 overflow-y-auto">
              {selectedSeats.map((s) => (
                <li
                  key={s.unit.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    <span
                      className="mr-1.5 inline-block size-2 rounded-full"
                      style={{ backgroundColor: s.zone.color || '#888' }}
                    />
                    {s.zone.label} · {s.unit.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-bold tabular-nums">
                      {formatTry(s.ticket!.price)}
                    </span>
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.filter((id) => id !== s.unit.id)
                        )
                      }
                      aria-label="Koltuk kaldır"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedSeats.length} koltuk
                  {selectedSeats.length >= MAX_SEATS ? ` (max ${MAX_SEATS})` : ''}
                </p>
                <p className="text-lg font-extrabold tabular-nums">{formatTry(total)}</p>
              </div>
              <Button
                type="button"
                className="h-12 rounded-xl px-6 font-bold"
                onClick={goCheckout}
              >
                <Ticket className="size-4" />
                Ödemeye Geç
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Kategori listesi için{' '}
        <Link
          href={`#kategori-listesi`}
          className="font-medium text-foreground underline-offset-2 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('kategori-listesi')?.scrollIntoView({
              behavior: 'smooth'
            });
          }}
        >
          aşağı kaydırın
        </Link>
      </p>

      <div id="kategori-listesi" className="space-y-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kategori özeti
        </p>
        {zones.map((zone, zoneIndex) => {
          const cells = cellsByZone.get(zone.code) ?? [];
          const sample = cells.find((c) => c.ticket)?.ticket;
          const available = cells.filter((c) => c.available).length;
          const accent = zoneAccent(zone, zoneIndex);
          return (
            <div
              key={zone.code}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{zone.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {available} koltuk müsait
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-base font-extrabold">
                {sample ? formatTry(sample.price) : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-full', className)} />
      {label}
    </span>
  );
}
