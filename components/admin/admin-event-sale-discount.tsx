'use client';

import { EventSaleDiscountPanel } from '@/components/organizator-panel/event-sale-discount-panel';

export function AdminEventSaleDiscount({
  eventId,
  isFree,
  categories,
  initial
}: {
  eventId: string;
  isFree: boolean;
  categories: Array<{ id: string; name: string; price: number }>;
  initial: {
    percent: number | null;
    ticketTypeIds: string[];
    active: boolean;
    endsAt: string | null;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Yüzde indirim
      </h2>
      <EventSaleDiscountPanel
        eventId={eventId}
        isFree={isFree}
        categories={categories}
        initial={initial}
        apiPath="/api/admin/events/sale-discount"
      />
    </div>
  );
}
