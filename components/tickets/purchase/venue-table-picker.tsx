'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import {
  ticketTypeAvailable,
  ticketTypeRemaining,
  splitTicketDisplay
} from '@/lib/tickets/purchase-types';
import { formatTry } from '@/lib/tickets/purchase-pricing';
import { parseSeatUnitCode } from '@/lib/tickets/seat-packages';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

type Props = {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  seatPlan: SeatPlan;
};

export function VenueTablePicker({ eventSlug, ticketTypes, seatPlan }: Props) {
  const zones = seatPlan.zones ?? [];
  const [zoneCode, setZoneCode] = useState(zones[0]?.code ?? 'B');

  const ticketByUnit = useMemo(() => {
    const map = new Map<string, CheckoutTicketType>();
    for (const tt of ticketTypes) {
      const code = parseSeatUnitCode(tt.name);
      if (code) map.set(code, tt);
    }
    return map;
  }, [ticketTypes]);

  const activeZone = zones.find((z) => z.code === zoneCode) ?? zones[0];

  if (!activeZone) {
    return null;
  }

  return (
    <div className="space-y-5">
      {seatPlan.mapImageUrl && (
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

      <div className="flex flex-wrap gap-2">
        {zones.map((zone) => (
          <button
            key={zone.code}
            type="button"
            onClick={() => setZoneCode(zone.code)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              zone.code === activeZone.code
                ? 'border-primary bg-primary/10 text-[var(--bf-accent-ink)]'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            {zone.label} · {zone.seatsPerUnit} kişi
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">{activeZone.label}</h2>
          <p className="text-xs text-muted-foreground">
            Her birim = {activeZone.seatsPerUnit} QR bilet
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {activeZone.units.map((unit) => {
            const ticket = ticketByUnit.get(unit.id);
            const available = ticket ? ticketTypeAvailable(ticket) : false;
            const remaining = ticket ? ticketTypeRemaining(ticket) : 0;
            const price = ticket?.price;

            if (!ticket) {
              return (
                <div
                  key={unit.id}
                  className="rounded-lg border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground"
                  title="Bu birim için bilet türü tanımlı değil"
                >
                  {unit.label}
                </div>
              );
            }

            if (!available) {
              return (
                <div
                  key={unit.id}
                  className="rounded-lg border border-border bg-muted/40 px-2 py-3 text-center text-xs text-muted-foreground line-through"
                >
                  {unit.label}
                  <span className="mt-0.5 block text-[10px]">Dolu</span>
                </div>
              );
            }

            return (
              <Link
                key={unit.id}
                href={`/etkinlik/${eventSlug}/bilet/${ticket.id}`}
                className="rounded-lg border border-primary/30 bg-primary/5 px-2 py-3 text-center transition-colors hover:border-primary hover:bg-primary/10"
              >
                <span className="block text-xs font-bold text-foreground">{unit.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold text-[var(--bf-accent-ink)]">
                  {price != null ? formatTry(price) : '—'}
                </span>
                {remaining <= 0 ? null : (
                  <span className="sr-only">{remaining} birim</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Liste görünümü
        </p>
        {ticketTypes
          .filter((t) => {
            const code = parseSeatUnitCode(t.name);
            return code?.startsWith(activeZone.code);
          })
          .map((type) => {
            const available = ticketTypeAvailable(type);
            const seats = Math.max(1, type.seatsPerUnit || 1);
            const { title } = splitTicketDisplay(type.name, type.description);
            return (
              <article
                key={type.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
                  !available && 'opacity-55'
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{title}</h3>
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {seats} kişi / QR
                    </Badge>
                    {!available && <Badge variant="secondary">Tükendi</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-extrabold">{formatTry(type.price)}</p>
                  {available ? (
                    <Button asChild size="sm" className="rounded-xl font-bold">
                      <Link href={`/etkinlik/${eventSlug}/bilet/${type.id}`}>
                        <Ticket className="size-3.5" />
                        Seç
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled size="sm" className="rounded-xl">
                      Dolu
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}
