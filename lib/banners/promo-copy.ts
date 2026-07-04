import type { MockEvent } from '@/lib/data/mock-events';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';

const CATEGORY_HIGHLIGHTS: Record<string, string> = {
  muzik: 'Canlı Konser',
  festival: 'Festival',
  tiyatro: 'Tiyatro',
  spor: 'Spor Etkinliği',
  sanat: 'Sanat & Sergi',
  komedi: 'Stand Up & Komedi',
  cocuk: 'Çocuk Etkinliği',
  teknoloji: 'Workshop & Teknoloji',
  online: 'Online Etkinlik',
  party: 'Party & Gece',
  diger: 'Özel Etkinlik'
};

export function buildEventPromoCopy(event: MockEvent): {
  highlight: string;
  promoLine: string;
} {
  const highlight =
    CATEGORY_HIGHLIGHTS[event.categorySlug] ?? event.category ?? 'Öne Çıkan Etkinlik';

  const datePart = formatEventDate(event.startDate);
  const timePart = formatEventTime(event.startDate);
  const location =
    event.isOnline || event.citySlug === 'online'
      ? 'Online'
      : [event.venue, event.city].filter(Boolean).join(', ') || event.city;

  const pricePart = event.isFree
    ? 'Ücretsiz'
    : event.price > 0
      ? `${event.price} ₺'den`
      : 'Biletler satışta';

  const promoLine = [datePart, timePart, location, pricePart]
    .filter(Boolean)
    .join(' · ');

  return { highlight, promoLine };
}
