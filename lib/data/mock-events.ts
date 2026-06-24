import type { EventType } from '@/types';
import { CATEGORY_IMAGES } from '@/lib/data/category-images';

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
  /** internal = Bilet Feed checkout, external = kaynak siteye yönlendir */
  listingType?: 'internal' | 'external';
  externalPlatform?: string;
  externalUrl?: string;
}

/** @deprecated Yalnızca geriye dönük import uyumluluğu — boş dizi */
export const mockEvents: MockEvent[] = [];

export const categories = [
  { slug: 'muzik', name: 'Konser', icon: '', count: 124, image: CATEGORY_IMAGES.muzik },
  { slug: 'festival', name: 'Festival', icon: '', count: 48, image: CATEGORY_IMAGES.festival },
  { slug: 'tiyatro', name: 'Tiyatro', icon: '', count: 67, image: CATEGORY_IMAGES.tiyatro },
  { slug: 'spor', name: 'Spor', icon: '', count: 89, image: CATEGORY_IMAGES.spor },
  { slug: 'sanat', name: 'Sanat', icon: '', count: 56, image: CATEGORY_IMAGES.sanat },
  { slug: 'komedi', name: 'Komedi', icon: '', count: 35, image: CATEGORY_IMAGES.komedi },
  { slug: 'cocuk', name: 'Çocuk', icon: '', count: 28, image: CATEGORY_IMAGES.cocuk },
  { slug: 'teknoloji', name: 'Workshop', icon: '', count: 42, image: CATEGORY_IMAGES.teknoloji },
  { slug: 'online', name: 'Online', icon: '', count: 19, image: CATEGORY_IMAGES.online },
  { slug: 'party', name: 'Party', icon: '', count: 0, image: CATEGORY_IMAGES.party }
];

export const cities = [
  { slug: 'istanbul', name: 'İstanbul', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80', count: 342 },
  { slug: 'ankara', name: 'Ankara', image: 'https://images.unsplash.com/photo-1594756205226-2a5a3d3a1f4d?w=600&q=80', count: 156 },
  { slug: 'izmir', name: 'İzmir', image: 'https://images.unsplash.com/photo-1539650116574-75c0c8129843?w=600&q=80', count: 98 },
  { slug: 'antalya', name: 'Antalya', image: 'https://images.unsplash.com/photo-1590073242678-ac664a692696?w=600&q=80', count: 74 },
  { slug: 'bursa', name: 'Bursa', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80', count: 45 },
  { slug: 'eskisehir', name: 'Eskişehir', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', count: 32 }
];

export function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
}

export function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
}

export function formatEventDateLong(dateStr: string): string {
  const formatted = new Date(dateStr).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatEventMonthDay(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString().padStart(2, '0')
  };
}

export function formatEventDateLine(event: MockEvent): string {
  const d = new Date(event.startDate);
  const datePart = d.toLocaleDateString('tr-TR', {
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
  const start = formatEventTime(event.startDate);
  const end = formatEventTime(event.endDate);
  const startMs = new Date(event.startDate).getTime();
  const endMs = new Date(event.endDate).getTime();
  const diffH = (endMs - startMs) / (60 * 60 * 1000);
  if (diffH <= 0 || diffH > 8) return start;
  return `${start} - ${end}`;
}

export function formatPrice(event: MockEvent): string {
  if (event.isFree || event.price === 0) return 'Ücretsiz';
  return `${event.price} ₺`;
}
