'use client';

import Link from 'next/link';
import { ExternalLink, ShieldCheck, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brandTheme } from '@/lib/config/brand-theme';
import {
  getEventTicketUrl,
  isExternalListing
} from '@/lib/events/ticket-url';
import { getEventPlatformTheme } from '@/lib/events/platform-theme';
import type { MockEvent } from '@/lib/data/mock-events';

interface EventPurchaseCardProps {
  event: MockEvent;
  purchasable?: boolean;
  className?: string;
  variant?: 'standalone' | 'embedded';
}

export function EventPurchaseCard({
  event,
  purchasable = true,
  className,
  variant = 'standalone'
}: EventPurchaseCardProps) {
  const theme = getEventPlatformTheme(event);
  const external = isExternalListing(event);
  const ticketUrl = getEventTicketUrl(event);
  const accent = external ? theme.accent : brandTheme.orange;
  const accentSoft = external ? theme.accentSoft : brandTheme.orangeSoft;
  const ctaLabel = external ? theme.ctaLabel : 'Bilet Al';

  const priceText =
    event.isFree || event.price === 0
      ? 'Ücretsiz'
      : `${event.price.toLocaleString('tr-TR')} ₺`;

  const priceHint =
    event.isFree || event.price === 0 ? 'Giriş ücretsiz' : 'başlayan fiyatlarla';

  return (
    <aside
      className={className}
      style={
        {
          '--event-accent': accent,
          '--event-accent-soft': accentSoft
        } as React.CSSProperties
      }
    >
      <div
        className={
          variant === 'embedded'
            ? 'space-y-4'
            : 'overflow-hidden rounded-2xl border border-border bg-card shadow-sm'
        }
      >
        <div
          className={
            variant === 'embedded'
              ? 'rounded-xl px-1 py-1'
              : 'px-5 py-4'
          }
          style={
            variant === 'embedded'
              ? undefined
              : { backgroundColor: 'var(--event-accent-soft)' }
          }
        >
          {variant === 'standalone' && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bilet fiyatı
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                {priceText}
              </p>
              {!event.isFree && event.price > 0 && (
                <p className="mt-0.5 text-sm text-muted-foreground">{priceHint}</p>
              )}
            </>
          )}
          {variant === 'embedded' && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--event-accent-soft)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bilet fiyatı
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                {priceText}
              </p>
              {!event.isFree && event.price > 0 && (
                <p className="mt-0.5 text-sm text-muted-foreground">{priceHint}</p>
              )}
            </div>
          )}
        </div>

        <div className={variant === 'embedded' ? 'space-y-4 px-1' : 'space-y-4 p-5'}>
          {purchasable ? (
            <Button
              size="lg"
              className="h-14 w-full gap-2 rounded-xl text-base font-bold text-white hover:opacity-95"
              style={{ backgroundColor: theme.accent }}
              asChild
            >
              {external ? (
                <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-5" />
                  {ctaLabel}
                </a>
              ) : (
                <Link href={ticketUrl}>
                  <Ticket className="size-5" />
                  {ctaLabel}
                </Link>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              disabled
              className="h-14 w-full rounded-xl text-base font-bold"
            >
              Bilet satışı henüz açık değil
            </Button>
          )}

          <ul className="space-y-2 text-sm text-muted-foreground">
            {external ? (
              <li className="flex items-start gap-2">
                <ExternalLink className="mt-0.5 size-4 shrink-0" />
                Ödeme ve bilet teslimi {theme.label} üzerinden tamamlanır.
              </li>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  Güvenli ödeme ve anında e-bilet
                </li>
                <li className="flex items-start gap-2">
                  <Ticket className="mt-0.5 size-4 shrink-0 text-primary" />
                  QR kod ile hızlı giriş
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
