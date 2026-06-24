export interface MockPurchasedTicket {
  id: string;
  code: string;
  validationToken?: string;
  eventSlug: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  venue: string;
  city: string;
  ticketType: string;
  price: number;
  status: 'VALID' | 'USED' | 'CANCELLED';
  qrData: string;
}

export const mockPurchasedTickets: MockPurchasedTicket[] = [
  {
    id: 't1',
    code: 'EVF-2026-001234',
    eventSlug: 'istanbul-muzik-festivali-2026',
    eventTitle: 'İstanbul Müzik Festivali 2026',
    eventImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    eventDate: '2026-07-15T18:00:00',
    venue: 'Life Park',
    city: 'İstanbul',
    ticketType: 'Genel Giriş',
    price: 450,
    status: 'VALID',
    qrData: 'EVF-2026-001234-USER-001'
  },
  {
    id: 't2',
    code: 'EVF-2026-005678',
    eventSlug: 'cem-yilmaz-diamond-elite-platinum-plus',
    eventTitle: 'Cem Yılmaz - Diamond Elite Platinum Plus',
    eventImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    eventDate: '2026-05-20T20:30:00',
    venue: 'Zorlu PSM',
    city: 'İstanbul',
    ticketType: 'VIP',
    price: 700,
    status: 'VALID',
    qrData: 'EVF-2026-005678-USER-001'
  },
  {
    id: 't3',
    code: 'EVF-2026-009012',
    eventSlug: 'tarkan-konseri-2026',
    eventTitle: 'Tarkan - Harbiye Açıkhava Konseri',
    eventImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    eventDate: '2026-06-25T21:00:00',
    venue: 'Harbiye Açıkhava',
    city: 'İstanbul',
    ticketType: 'Genel Giriş',
    price: 650,
    status: 'VALID',
    qrData: 'EVF-2026-009012-USER-001'
  },
  {
    id: 't4',
    code: 'EVF-2025-004321',
    eventSlug: 'antalya-jazz-gecesi',
    eventTitle: 'Antalya Jazz Gecesi',
    eventImage: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
    eventDate: '2025-11-12T20:00:00',
    venue: 'Aspendos Kültür Merkezi',
    city: 'Antalya',
    ticketType: 'Genel Giriş',
    price: 320,
    status: 'USED',
    qrData: 'EVF-2025-004321-USER-001'
  }
];

export function getTicketById(id: string) {
  return mockPurchasedTickets.find((t) => t.id === id);
}

export const mockNotifications = [
  {
    id: 'n1',
    title: 'Bilet Onaylandı',
    body: 'İstanbul Müzik Festivali biletiniz hazır.',
    time: '2 saat önce',
    read: false,
    type: 'ticket'
  },
  {
    id: 'n2',
    title: 'Yeni Etkinlik',
    body: 'Favori kategorinizde yeni bir konser eklendi.',
    time: '1 gün önce',
    read: false,
    type: 'event'
  },
  {
    id: 'n3',
    title: 'Hatırlatma',
    body: 'Cem Yılmaz gösterisi 3 gün sonra başlıyor.',
    time: '2 gün önce',
    read: true,
    type: 'reminder'
  }
];

export const mockFaqs = [
  {
    category: 'Biletler',
    items: [
      {
        q: 'Biletimi nasıl alırım?',
        a: 'Etkinlik sayfasından bilet türünü seçip ödeme adımlarını tamamlayabilirsiniz.'
      },
      {
        q: 'Biletimi iptal edebilir miyim?',
        a: 'Etkinlik tarihinden 48 saat öncesine kadar iptal talebinde bulunabilirsiniz.'
      }
    ]
  },
  {
    category: 'Ödeme',
    items: [
      {
        q: 'Hangi ödeme yöntemleri kabul ediliyor?',
        a: 'Kredi kartı, banka kartı ve dijital cüzdanlar desteklenmektedir.'
      },
      {
        q: 'Taksit imkanı var mı?',
        a: '500 TL üzeri alışverişlerde taksit seçenekleri sunulmaktadır.'
      }
    ]
  },
  {
    category: 'Etkinlik Günü',
    items: [
      {
        q: 'QR kodumu nasıl kullanırım?',
        a: 'Biletlerim sayfasından QR kodunuzu göstererek giriş yapabilirsiniz.'
      },
      {
        q: 'Biletimi transfer edebilir miyim?',
        a: 'Bazı etkinliklerde bilet transferi desteklenmektedir.'
      }
    ]
  }
];
