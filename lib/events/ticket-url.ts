import type { MockEvent } from '@/lib/data/mock-events';
import { PLATFORM_LABELS } from '@/lib/scraper/types';
import type { ExternalPlatform } from '@prisma/client';

export function getEventTicketUrl(event: MockEvent): string {
  if (event.listingType === 'external' && event.externalUrl) {
    return event.externalUrl;
  }
  return `/etkinlik/${event.slug}/bilet`;
}

export function isExternalListing(event: MockEvent): boolean {
  return event.listingType === 'external' && Boolean(event.externalUrl);
}

export function getExternalPlatformLabel(
  platform?: string | null
): string | null {
  if (!platform) return null;
  return PLATFORM_LABELS[platform as ExternalPlatform] || platform;
}

export function getTicketButtonLabel(event: MockEvent): string {
  if (isExternalListing(event)) {
    return 'Resmi Bilet Sitesine Git';
  }
  return 'Bilet Satın Al';
}

export function getTicketButtonShortLabel(event: MockEvent): string {
  if (isExternalListing(event)) {
    return 'Resmi Site';
  }
  return 'Bilet Al';
}
