'use client';

import Link from 'next/link';
import { ExternalLink, Ticket } from 'lucide-react';
import { useTranslations } from '@/components/providers';
import { Button } from '@/components/ui/button';
import {
  getEventTicketUrl,
  isExternalListing
} from '@/lib/events/ticket-url';
import { getEventPlatformTheme } from '@/lib/events/platform-theme';
import type { MockEvent } from '@/lib/data/mock-events';
import { mobileBottomNavOffsetClass, shouldHideBottomNav } from '@/lib/layout/navigation';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface EventMobileTicketBarProps {
  event: MockEvent;
  purchasable?: boolean;
}

export function EventMobileTicketBar({
  event,
  purchasable = true
}: EventMobileTicketBarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const hideBottomNav = shouldHideBottomNav(pathname);
  const external = isExternalListing(event);
  const ticketUrl = getEventTicketUrl(event);
  const theme = getEventPlatformTheme(event);

  const priceText =
    event.isFree || event.price === 0
      ? t.events.free
      : `${event.price.toLocaleString('tr-TR')} ₺`;

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 border-t bg-background/95 px-4 py-3 backdrop-blur-md md:hidden',
        hideBottomNav
          ? 'bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
          : cn(mobileBottomNavOffsetClass)
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t.events.startingPrice}
          </p>
          <p className="truncate text-lg font-bold">{priceText}</p>
        </div>
        {purchasable ? (
          <Button
            size="lg"
            className="h-12 shrink-0 gap-2 rounded-xl px-5 text-sm font-bold hover:opacity-95"
            style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
            asChild
          >
            {external ? (
              <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-5" />
                {theme.ctaLabel}
              </a>
            ) : (
              <Link href={ticketUrl}>
                <Ticket className="size-5" />
                {theme.ctaLabel}
              </Link>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            disabled
            className="h-12 shrink-0 rounded-xl px-5 text-sm font-bold"
          >
            {t.events.salesClosed}
          </Button>
        )}
      </div>
    </div>
  );
}
