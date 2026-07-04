import type { EventType } from '@/types';
import { CATEGORY_IMAGES } from '@/lib/data/category-images';
import {
  formatTurkeyDate,
  formatTurkeyDateLong,
  formatTurkeyEventDate,
  formatTurkeyTime,
  formatTurkeyTimeRange
} from '@/lib/datetime/istanbul';

import type { EventStatus } from '@prisma/client';

export interface MockEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  gallery: string[];
  category: string;
  categorySlug: string;
  eventType: EventType;
  city: string;
  citySlug: string;
  venue: string;
  address: string;
  organizer: string;
  organizerSlug: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  isFree: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isOnline?: boolean;
  discountPercent?: number;
  attendees: number;
  capacity: number;
  tags: string[];
  favoriteCount?: number;
  /** internal = Bilet Feed checkout, external = kaynak siteye yönlendir */
  listingType?: 'internal' | 'external';
  externalPlatform?: string;
  externalUrl?: string;
  /** Dahili etkinliklerde onay akışı durumu — profil/önizleme için */
  status?: EventStatus;
  /** Organizatörün belirlediği etkinlik kuralları */
  rules?: string;
}

/** @deprecated Yalnızca geriye dönük import uyumluluğu — boş dizi */
export const mockEvents: MockEvent[] = [];

export const categories = [
  { slug: 'muzik', name: 'Konser', icon: '', count: 124, image: CATEGORY_IMAGES.muzik },
  { slug: 'party', name: 'Party', icon: '', count: 0, image: CATEGORY_IMAGES.party },
  { slug: 'festival', name: 'Festival', icon: '', count: 48, image: CATEGORY_IMAGES.festival },
  { slug: 'tiyatro', name: 'Tiyatro', icon: '', count: 67, image: CATEGORY_IMAGES.tiyatro },
  { slug: 'komedi', name: 'Stand Up', icon: '', count: 35, image: CATEGORY_IMAGES.komedi },
  { slug: 'spor', name: 'Spor', icon: '', count: 89, image: CATEGORY_IMAGES.spor },
  { slug: 'sanat', name: 'Sanat', icon: '', count: 56, image: CATEGORY_IMAGES.sanat },
  { slug: 'cocuk', name: 'Çocuk', icon: '', count: 28, image: CATEGORY_IMAGES.cocuk },
  { slug: 'teknoloji', name: 'Workshop', icon: '', count: 42, image: CATEGORY_IMAGES.teknoloji },
  { slug: 'online', name: 'Online', icon: '', count: 19, image: CATEGORY_IMAGES.online },
  { slug: 'yemek', name: 'Yemek & İçecek', icon: '', count: 0, image: CATEGORY_IMAGES.yemek },
  { slug: 'diger', name: 'Diğer', icon: '', count: 0, image: CATEGORY_IMAGES.muzik }
];

export const cities = [
  { slug: 'istanbul', name: 'İstanbul', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80', count: 0 },
  { slug: 'ankara', name: 'Ankara', image: 'https://images.unsplash.com/photo-1594756205226-2a5a3d3a1f4d?w=600&q=80', count: 0 },
  { slug: 'izmir', name: 'İzmir', image: 'https://images.unsplash.com/photo-1539650116574-75c0c8129843?w=600&q=80', count: 0 },
  { slug: 'antalya', name: 'Antalya', image: 'https://images.unsplash.com/photo-1590073242678-ac664a692696?w=600&q=80', count: 0 },
  { slug: 'bursa', name: 'Bursa', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80', count: 0 },
  { slug: 'eskisehir', name: 'Eskişehir', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', count: 0 }
];

export function formatEventDate(dateStr: string): string {
  return formatTurkeyEventDate(dateStr);
}

export function formatEventTime(dateStr: string): string {
  return formatTurkeyTime(dateStr);
}

export function formatEventDateLong(dateStr: string): string {
  return formatTurkeyDateLong(dateStr);
}

export function formatEventMonthDay(dateStr: string): { month: string; day: string } {
  return {
    month: formatTurkeyDate(dateStr, { month: 'short' }).toUpperCase(),
    day: formatTurkeyDate(dateStr, { day: '2-digit' })
  };
}

export function formatEventDateLine(event: MockEvent): string {
  const datePart = formatTurkeyDate(event.startDate, {
    day: 'numeric',
    month: 'short'
  });
  const location =
    event.isOnline || event.citySlug === 'online'
      ? 'Online'
      : `${event.city}, Türkiye`;
  return `${datePart} | ${location}`;
}

export function formatEventTimeRange(event: MockEvent): string {
  return formatTurkeyTimeRange(event.startDate, event.endDate);
}

export function formatPrice(event: MockEvent): string {
  if (event.isFree || event.price === 0) return 'Ücretsiz';
  return `${event.price} ₺`;
}
