'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Info, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PurchasePriceBreakdown } from '@/components/tickets/purchase/purchase-price-breakdown';
import { useTranslations } from '@/components/providers';
import { useCart } from '@/components/providers/cart-provider';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import {
  ticketTypeRemaining,
  splitTicketDisplay
} from '@/lib/tickets/purchase-types';
import { SalePriceLabel } from '@/components/tickets/purchase/sale-price-label';

export type QuantityStepEventInfo = {
  id: string;
  slug: string;
  title: string;
  startDate: string;
  coverImage?: string | null;
};

interface QuantityStepProps {
  eventSlug: string;
  ticketType: CheckoutTicketType;
  event?: QuantityStepEventInfo;
}

export function QuantityStep({
  eventSlug,
  ticketType,
  event
}: QuantityStepProps) {
  const t = useTranslations();
  const router = useRouter();
  const cart = useCart();
  const maxQty = Math.min(10, ticketTypeRemaining(ticketType));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { title, description } = splitTicketDisplay(
    ticketType.name,
    ticketType.description
  );

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => Math.min(maxQty, q + 1));
  }

  function addToCart() {
    if (!event) {
      router.push(
        `/etkinlik/${eventSlug}/bilet/${ticketType.id}/odeme?adet=${quantity}`
      );
      return;
    }
    cart.addLine({
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      eventStartAt: event.startDate,
      eventCoverImage: event.coverImage,
      ticketTypeId: ticketType.id,
      ticketTypeName: title,
      unitPrice: ticketType.price,
      quantity,
      isBogo: ticketType.isBogo
    });
    setAdded(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
        <h1 className="text-lg font-bold">{t.purchase.quantitySelect}</h1>
        <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-3">
          <SalePriceLabel
            price={ticketType.price}
            listPrice={ticketType.listPrice}
            isOnSale={ticketType.isOnSale}
            discountPercent={ticketType.discountPercent}
            isBogo={ticketType.isBogo}
            freeLabel={t.common.free}
            className="items-start"
            priceClassName="text-2xl"
          />
        </div>
        {ticketType.isBogo ? (
          <p className="mt-2 text-sm text-primary">
            1 alana 1 bedava — her 2 bilette 1 ücretsiz
          </p>
        ) : null}

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

        {maxQty < 10 ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t.purchase.maxTickets(maxQty)}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t.purchase.priceSummary}
        </h2>
        <div className="mt-4">
          <PurchasePriceBreakdown
            unitPrice={ticketType.price}
            quantity={quantity}
            isBogo={ticketType.isBogo}
          />
        </div>
      </section>

      {description ? (
        <section className="rounded-2xl border border-border bg-muted/30 p-5 text-card-foreground">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </section>
      ) : null}

      {added ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
          <p className="font-semibold text-foreground">Bilet sepetine eklendi</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="h-12 flex-1 rounded-xl font-bold">
              <Link href="/etkinlikler">Başka etkinlik ekle</Link>
            </Button>
            <Button asChild className="h-12 flex-1 rounded-xl font-bold">
              <Link href="/sepet">Bilet Sepetine Git</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-full rounded-xl text-base font-bold"
            onClick={addToCart}
          >
            <ShoppingBag className="size-4" />
            Sepete Ekle
          </Button>
        </div>
      )}
    </div>
  );
}
