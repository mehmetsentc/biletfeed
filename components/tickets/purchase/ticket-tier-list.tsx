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
import { cn } from '@/lib/utils';

interface TicketTierListProps {
  eventSlug: string;
  ticketTypes: CheckoutTicketType[];
  className?: string;
}

export function TicketTierList({
  eventSlug,
  ticketTypes,
  className
}: TicketTierListProps) {
  if (ticketTypes.length === 0) {
    return (
      <div className={cn('rounded-2xl border bg-card p-6 text-center', className)}>
        <p className="text-muted-foreground">Bu etkinlik için aktif bilet bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {ticketTypes.map((type) => {
        const available = ticketTypeAvailable(type);
        const remaining = ticketTypeRemaining(type);
        const priceLabel = type.price <= 0 ? 'Ücretsiz' : formatTry(type.price);

        return (
          <article
            key={type.id}
            className={cn(
              'flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
              !available && 'opacity-60'
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold">{type.name}</h2>
                {type.showLowStockBadge && available && (
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-[var(--bf-orange-surface)] text-primary"
                  >
                    Tükenmek üzere
                  </Badge>
                )}
                {!available && (
                  <Badge variant="secondary" className="rounded-full">
                    Tükendi
                  </Badge>
                )}
              </div>
              {available && remaining <= 20 && (
                <p className="text-xs text-muted-foreground">
                  Son {remaining} bilet
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-xl font-extrabold tracking-tight">{priceLabel}</p>
              {available ? (
                <Button
                  asChild
                  className="h-11 rounded-xl bg-primary px-6 font-bold text-white hover:bg-[var(--bf-orange-hover)]"
                >
                  <Link href={`/etkinlik/${eventSlug}/bilet/${type.id}`}>
                    <Ticket className="size-4" />
                    Satın Al
                  </Link>
                </Button>
              ) : (
                <Button disabled className="h-11 rounded-xl px-6 font-bold">
                  Tükendi
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
