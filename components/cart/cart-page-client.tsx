'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/cart-provider';
import {
  cartSubtotal,
  formatCartEventDate,
  groupCartLinesByEvent
} from '@/lib/cart/storage';
import { formatTry } from '@/lib/tickets/purchase-pricing';

export function CartPageClient() {
  const { lines, hydrated, updateQuantity, removeLine, clear, ticketCount } =
    useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Bilet sepetin boş</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Farklı günlerdeki etkinliklerden bilet ekleyip tek seferde ödeyebilirsin.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-xl font-bold">
            <Link href="/etkinlikler">Etkinlikleri Keşfet</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl font-bold">
            <Link href="/biletlerim">Yapılan alışverişler</Link>
          </Button>
        </div>
      </div>
    );
  }

  const groups = groupCartLinesByEvent(lines);
  const total = cartSubtotal(lines);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Bilet Sepeti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticketCount} bilet · {groups.length} etkinlik
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => clear()}
        >
          Temizle
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section
            key={group.eventId}
            className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
          >
            <div className="flex gap-3 border-b border-border p-4">
              {group.eventCoverImage ? (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={group.eventCoverImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <Link
                  href={`/etkinlik/${group.eventSlug}`}
                  className="font-bold hover:text-primary"
                >
                  {group.eventTitle}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatCartEventDate(group.eventStartAt)}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-border">
              {group.lines.map((line) => {
                const qty =
                  line.seatUnitIds && line.seatUnitIds.length > 0
                    ? line.seatUnitIds.length
                    : line.quantity;
                const paidQty = line.isBogo ? Math.ceil(qty / 2) : qty;
                const lineTotal = line.unitPrice * paidQty;
                const isSeat = Boolean(line.seatUnitIds?.length);

                return (
                  <li
                    key={line.key}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{line.ticketTypeName}</p>
                      {isSeat ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Koltuk: {line.seatUnitIds!.join(', ')}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                        {formatTry(line.unitPrice)}
                        {line.isBogo ? ' · 1+1' : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      {isSeat ? (
                        <span className="text-sm font-medium tabular-nums">
                          {qty} koltuk
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-lg"
                            onClick={() =>
                              updateQuantity(line.key, line.quantity - 1)
                            }
                            aria-label="Azalt"
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="min-w-[1.5rem] text-center font-bold tabular-nums">
                            {line.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 rounded-lg"
                            onClick={() =>
                              updateQuantity(line.key, line.quantity + 1)
                            }
                            aria-label="Artır"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      )}
                      <p className="min-w-[4.5rem] text-right font-bold tabular-nums">
                        {formatTry(lineTotal)}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground"
                        onClick={() => removeLine(line.key)}
                        aria-label="Kaldır"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 mt-8 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Toplam
            </p>
            <p className="text-2xl font-extrabold tabular-nums">
              {formatTry(total)}
            </p>
          </div>
          <Button asChild size="lg" className="h-12 rounded-xl px-6 font-bold">
            <Link href="/sepet/odeme">Ödemeye Geç</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
