import type { EventType } from '@/types';

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
  { slug: 'muzik', name: 'Eğlence', icon: '🎵', count: 124, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80' },
  { slug: 'teknoloji', name: 'Eğitim & İş', icon: '💻', count: 42, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80' },
  { slug: 'sanat', name: 'Kültür & Sanat', icon: '🎨', count: 56, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80' },
  { slug: 'spor', name: 'Spor & Fitness', icon: '⚽', count: 89, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80' },
  { slug: 'festival', name: 'Festival', icon: '🎪', count: 48, image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80' },
  { slug: 'yemek', name: 'Yemek & İçecek', icon: '🍽️', count: 35, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
  { slug: 'tiyatro', name: 'Tiyatro', icon: '🎭', count: 67, image: 'https://images.unsplash.com/photo-1507676184292-0b9a1a7eee41?w=400&q=80' },
  { slug: 'online', name: 'Online', icon: '🌐', count: 28, image: 'https://images.unsplash.com/photo-1516280440614-379379bb8731?w=400&q=80' }
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
    year: 'numeric'
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
    year: 'numeric'
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
