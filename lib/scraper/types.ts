import type { ExternalPlatform, EventType } from '@prisma/client';

export interface ScrapedEventRaw {
  platform: ExternalPlatform;
  externalId: string;
  externalUrl: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage: string;
  gallery?: string[];
  citySlug: string;
  cityName: string;
  venue?: string;
  address?: string;
  categorySlug: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  price: number;
  isFree: boolean;
  isOnline?: boolean;
  tags?: string[];
}

export interface ScraperResult {
  platform: ExternalPlatform;
  events: ScrapedEventRaw[];
  errors: string[];
}

export interface ScraperAdapter {
  platform: ExternalPlatform;
  label: string;
  scrapeNewEvents: () => Promise<ScraperResult>;
}

export const PLATFORM_LABELS: Record<ExternalPlatform, string> = {
  BILETIX: 'Biletix',
  BUBILET: 'Bubilet',
  BILETINO: 'Biletino',
  BILETIMO: 'Biletimo',
  PASSO: 'Passo',
  GECCE: 'Gecce.com'
};

/** Düşük sayı = yüksek öncelik (aynı etkinlik birden fazla kaynaktaysa) */
export const PLATFORM_PRIORITY: Record<ExternalPlatform, number> = {
  BILETIX: 1,
  PASSO: 2,
  BUBILET: 3,
  BILETINO: 4,
  BILETIMO: 5,
  GECCE: 6
};

export const SCRAPER_USER_AGENT =
  'BiletFeedBot/1.0 (+https://biletfeed.com; event-aggregator)';
