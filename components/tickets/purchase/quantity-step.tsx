'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PurchasePriceBreakdown } from '@/components/tickets/purchase/purchase-price-breakdown';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-context';
import { ticketTypeRemaining } from '@/lib/tickets/purchase-context';
import { formatTry } from '@/lib/tickets/purchase-pricing';

interface QuantityStepProps {
  eventSlug: string;
  ticketType: CheckoutTicketType;
}

export function QuantityStep({ eventSlug, ticketType }: QuantityStepProps) {
  const maxQty = Math.min(10, ticketTypeRemaining(ticketType));
  const [quantity, setQuantity] = useState(1);

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => Math.min(maxQty, q + 1));
  }

  const unitLabel = ticketType.price <= 0 ? 'Ücretsiz' : formatTry(ticketType.price);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5 md:p-6">
        <h1 className="text-lg font-bold">Adet Seçin</h1>
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
            aria-label="Azalt"
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
            aria-label="Artır"
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {maxQty < 10 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            En fazla {maxQty} bilet seçebilirsiniz
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fiyat Özeti
        </h2>
        <div className="mt-4">
          <PurchasePriceBreakdown
            unitPrice={ticketType.price}
            quantity={quantity}
          />
        </div>
      </section>

      <Button
        asChild
        size="lg"
        className="h-14 w-full rounded-xl bg-[#FF8A00] text-base font-bold text-white hover:bg-[#F57C00]"
      >
        <Link
          href={`/etkinlik/${eventSlug}/bilet/${ticketType.id}/odeme?adet=${quantity}`}
        >
          Ödemeye Geç
        </Link>
      </Button>
    </div>
  );
}
