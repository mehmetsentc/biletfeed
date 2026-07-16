import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import {
  ticketTypeAvailable,
  ticketTypeRemaining
} from '@/lib/tickets/purchase-types';
import { formatTry } from '@/lib/tickets/purchase-pricing';
import { getServerTranslations } from '@/lib/i18n/server';
import { VenueTablePicker } from '@/components/tickets/purchase/venue-table-picker';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { cn } from '@/lib/utils';

interface TicketTierListProps {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  seatPlan?: SeatPlan | null;
  className?: string;
}

export async function TicketTierList({
  eventSlug,
  ticketTypes,
  seatPlan,
  className
}: TicketTierListProps) {
  const { t } = await getServerTranslations();

  if (ticketTypes.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-border bg-card p-6 text-center text-card-foreground',
          className
        )}
      >
        <p className="text-muted-foreground">{t.events.noActiveTickets}</p>
      </div>
    );
  }

  const useTablePicker =
    seatPlan?.layout === 'tables' &&
    Array.isArray(seatPlan.zones) &&
    seatPlan.zones.length > 0 &&
    ticketTypes.some((tt) => (tt.seatsPerUnit ?? 1) > 1);

  if (useTablePicker && seatPlan) {
    return (
      <div className={className}>
        <VenueTablePicker
          eventSlug={eventSlug}
          ticketTypes={ticketTypes}
          seatPlan={seatPlan}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {ticketTypes.map((type) => {
        const available = ticketTypeAvailable(type);
        const remaining = ticketTypeRemaining(type);
        const seats = Math.max(1, type.seatsPerUnit || 1);
        const priceLabel = type.price <= 0 ? t.common.free : formatTry(type.price);

        return (
          <article
            key={type.id}
            className={cn(
              'flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:flex-row sm:items-center sm:justify-between sm:p-5',
              !available && 'opacity-60'
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">{type.name}</h2>
                {seats > 1 && (
                  <Badge variant="secondary" className="rounded-full">
                    {seats} kişi / QR
                  </Badge>
                )}
                {type.showLowStockBadge && available && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-[var(--bf-orange-surface)] text-primary"
                  >
                    {t.events.almostGone}
                  </Badge>
                )}
                {!available && (
                  <Badge variant="secondary" className="rounded-full">
                    {t.events.soldOut}
                  </Badge>
                )}
              </div>
              {type.description?.trim() && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {type.description.trim()}
                </p>
              )}
              {available && remaining <= 20 && (
                <p className="text-xs text-muted-foreground">
                  {t.events.lastTickets(remaining)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-xl font-extrabold tracking-tight">{priceLabel}</p>
              {available ? (
                <Button asChild className="h-11 rounded-xl px-6 font-bold">
                  <Link href={`/etkinlik/${eventSlug}/bilet/${type.id}`}>
                    <Ticket className="size-4" />
                    {t.events.buy}
                  </Link>
                </Button>
              ) : (
                <Button disabled className="h-11 rounded-xl px-6 font-bold">
                  {t.events.soldOut}
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
