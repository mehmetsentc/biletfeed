'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PurchasePriceBreakdown } from '@/components/tickets/purchase/purchase-price-breakdown';
import { useTranslations } from '@/components/providers';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import { ticketTypeRemaining } from '@/lib/tickets/purchase-types';
import { formatTry } from '@/lib/tickets/purchase-pricing';

interface QuantityStepProps {
  eventSlug: string;
  ticketType: CheckoutTicketType;
}

export function QuantityStep({ eventSlug, ticketType }: QuantityStepProps) {
  const t = useTranslations();
  const maxQty = Math.min(10, ticketTypeRemaining(ticketType));
  const [quantity, setQuantity] = useState(1);

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => Math.min(maxQty, q + 1));
  }

  const unitLabel = ticketType.price <= 0 ? t.common.free : formatTry(ticketType.price);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
        <h1 className="text-lg font-bold">{t.purchase.quantitySelect}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ticketType.name}</p>
        <p className="mt-3 text-2xl font-extrabold">{unitLabel}</p>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12 rounded-xl"
            onClick={decrement}
            disabled={quantity <= 1}
            aria-label={`${t.purchase.quantity} −`}
          >
            <Minus className="size-5" />
          </Button>
          <span className="min-w-[3rem] text-center text-3xl font-extrabold tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-12 rounded-xl"
            onClick={increment}
            disabled={quantity >= maxQty}
            aria-label={`${t.purchase.quantity} +`}
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {maxQty < 10 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t.purchase.maxTickets(maxQty)}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.purchase.priceSummary}
        </h2>
        <div className="mt-4">
          <PurchasePriceBreakdown
            unitPrice={ticketType.price}
            quantity={quantity}
          />
        </div>
      </section>

      {ticketType.description?.trim() && (
        <section className="rounded-2xl border border-border bg-muted/30 p-5 text-card-foreground">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {ticketType.description.trim()}
            </p>
          </div>
        </section>
      )}

      <Button
        asChild
        size="lg"
        className="h-14 w-full rounded-xl text-base font-bold"
      >
        <Link
          href={`/etkinlik/${eventSlug}/bilet/${ticketType.id}/odeme?adet=${quantity}`}
        >
          {t.purchase.checkout}
        </Link>
      </Button>
    </div>
  );
}
