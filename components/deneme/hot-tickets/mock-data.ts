export type HotTicketEvent = {
  id: string;
  title: string;
  venue: string;
  city: string;
  category: string;
  /** YYYY-MM-DD */
  date: string;
  time: string;
  priceLabel: string;
  coverImage: string;
};

export const HOT_TICKETS_DEMO_CITY = 'İstanbul';

/** Local deneme — videodaki UI için sabit örnek etkinlikler. */
export const HOT_TICKET_EVENTS: HotTicketEvent[] = [
  {
    id: 'ferhangi',
    title: 'Ferhangi Şeyler',
    venue: 'Zorlu PSM - Turkcell Sahnesi',
    city: 'İstanbul',
    category: 'THEATER',
    date: '2026-08-14',
    time: '20:30',
    priceLabel: '₺180-450',
    coverImage:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'rihanna',
    title: 'Rihanna',
    venue: 'Vodafone Park Arena',
    city: 'İstanbul',
    category: 'MUSIC',
    date: '2026-08-14',
    time: '21:00',
    priceLabel: '₺120-385',
    coverImage:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'fazil-say',
    title: 'Fazıl Say Truva Sonatı',
    venue: 'Volkswagen Arena',
    city: 'İstanbul',
    category: 'MUSIC',
    date: '2026-08-15',
    time: '21:00',
    priceLabel: '₺250-720',
    coverImage:
      'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'sezen',
    title: 'Sezen Aksu',
    venue: 'Harbiye Cemil Topuzlu',
    city: 'İstanbul',
    category: 'MUSIC',
    date: '2026-08-15',
    time: '21:30',
    priceLabel: '₺500-1500',
    coverImage:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'duman',
    title: 'Duman',
    venue: 'KüçükÇiftlik Park',
    city: 'İstanbul',
    category: 'MUSIC',
    date: '2026-08-16',
    time: '20:00',
    priceLabel: '₺350-900',
    coverImage:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'electronic',
    title: 'Afterlife İstanbul',
    venue: 'Life Park',
    city: 'İstanbul',
    category: 'PARTY',
    date: '2026-08-16',
    time: '23:00',
    priceLabel: '₺600-1800',
    coverImage:
      'https://images.unsplash.com/photo-1571266028247-d22032458fd4?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'cem-yilmaz',
    title: 'Cem Yılmaz',
    venue: 'Zorlu PSM',
    city: 'İstanbul',
    category: 'COMEDY',
    date: '2026-08-17',
    time: '21:00',
    priceLabel: '₺400-1100',
    coverImage:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ataseri',
    title: 'Ata Demirer',
    venue: 'Maximum Uniq Hall',
    city: 'İstanbul',
    category: 'COMEDY',
    date: '2026-08-17',
    time: '22:30',
    priceLabel: '₺280-750',
    coverImage:
      'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'hamlet',
    title: 'Hamlet',
    venue: 'Şehir Tiyatroları',
    city: 'İstanbul',
    category: 'THEATER',
    date: '2026-08-18',
    time: '20:00',
    priceLabel: '₺90-220',
    coverImage:
      'https://images.unsplash.com/photo-1503096633772-1c49c8a3b6d4?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'teoman',
    title: 'Teoman',
    venue: 'Volkswagen Arena',
    city: 'İstanbul',
    category: 'MUSIC',
    date: '2026-08-19',
    time: '21:00',
    priceLabel: '₺320-850',
    coverImage:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ballet',
    title: 'Kuğu Gölü',
    venue: 'AKM',
    city: 'İstanbul',
    category: 'ARTS',
    date: '2026-08-20',
    time: '20:00',
    priceLabel: '₺200-600',
    coverImage:
      'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=900&q=80'
  }
];

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const MONTH_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC'
] as const;

export function parseEventDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function formatDayBadge(isoDate: string): {
  day: number;
  weekday: string;
  month: string;
} {
  const date = parseEventDate(isoDate);
  return {
    day: date.getDate(),
    weekday: DAY_SHORT[date.getDay()]!,
    month: MONTH_SHORT[date.getMonth()]!
  };
}

export function uniqueSortedDates(events: HotTicketEvent[]): string[] {
  return [...new Set(events.map((e) => e.date))].sort();
}

export function eventsSorted(events: HotTicketEvent[]): HotTicketEvent[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

export function eventsForDate(events: HotTicketEvent[], isoDate: string): HotTicketEvent[] {
  return events.filter((e) => e.date === isoDate);
}
