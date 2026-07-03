export interface SeedCategory {
  slug: string;
  icon: string;
  titleTr: string;
  titleEn: string;
  descriptionTr?: string;
  descriptionEn?: string;
  sortOrder: number;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { slug: 'giris', icon: 'door-open', titleTr: 'Giriş', titleEn: 'Entry', sortOrder: 1 },
  { slug: 'yas', icon: 'user-check', titleTr: 'Yaş', titleEn: 'Age', sortOrder: 2 },
  { slug: 'cocuk', icon: 'baby', titleTr: 'Çocuk', titleEn: 'Children', sortOrder: 3 },
  { slug: 'bilet', icon: 'ticket', titleTr: 'Bilet', titleEn: 'Tickets', sortOrder: 4 },
  { slug: 'odeme', icon: 'credit-card', titleTr: 'Ödeme', titleEn: 'Payment', sortOrder: 5 },
  { slug: 'oturma', icon: 'armchair', titleTr: 'Oturma', titleEn: 'Seating', sortOrder: 6 },
  { slug: 'guvenlik', icon: 'shield', titleTr: 'Güvenlik', titleEn: 'Security', sortOrder: 7 },
  { slug: 'fotograf', icon: 'camera', titleTr: 'Fotoğraf & Video', titleEn: 'Photo & Video', sortOrder: 8 },
  { slug: 'gizlilik', icon: 'eye-off', titleTr: 'Gizlilik', titleEn: 'Privacy', sortOrder: 9 },
  { slug: 'yiyecek', icon: 'utensils', titleTr: 'Yiyecek & İçecek', titleEn: 'Food & Drink', sortOrder: 10 },
  { slug: 'evcil-hayvan', icon: 'dog', titleTr: 'Evcil Hayvan', titleEn: 'Pets', sortOrder: 11 },
  { slug: 'hava', icon: 'cloud-sun', titleTr: 'Hava Koşulları', titleEn: 'Weather', sortOrder: 12 },
  { slug: 'saglik', icon: 'heart-pulse', titleTr: 'Sağlık', titleEn: 'Health', sortOrder: 13 },
  { slug: 'spor', icon: 'trophy', titleTr: 'Spor', titleEn: 'Sports', sortOrder: 14 },
  { slug: 'festival', icon: 'tent', titleTr: 'Festival', titleEn: 'Festival', sortOrder: 15 },
  { slug: 'konaklama', icon: 'bed', titleTr: 'Konaklama', titleEn: 'Accommodation', sortOrder: 16 },
  { slug: 'mekan', icon: 'map-pin', titleTr: 'Mekan', titleEn: 'Venue', sortOrder: 17 },
  { slug: 'dress-code', icon: 'shirt', titleTr: 'Kıyafet Kodu', titleEn: 'Dress Code', sortOrder: 18 },
  { slug: 'organizator-haklari', icon: 'scale', titleTr: 'Organizatör Hakları', titleEn: 'Organizer Rights', descriptionTr: 'Program değişikliği, iptal, erteleme ve güvenlik gibi organizatörün yasal hakları.', descriptionEn: 'Legal organizer rights: program changes, cancellation, postponement, security.', sortOrder: 19 },
  { slug: 'ticari', icon: 'store', titleTr: 'Ticari Faaliyet', titleEn: 'Commercial Activity', descriptionTr: 'Satış, broşür dağıtımı, bilet karaborsası ve sponsor kuralları.', descriptionEn: 'Rules on sales, flyers, ticket scalping and sponsors.', sortOrder: 20 },
  { slug: 'kisisel-esyalar', icon: 'backpack', titleTr: 'Kişisel Eşyalar', titleEn: 'Personal Belongings', sortOrder: 21 },
  { slug: 'erisilebilirlik', icon: 'accessibility', titleTr: 'Erişilebilirlik', titleEn: 'Accessibility', sortOrder: 22 },
  { slug: 'hizmetler', icon: 'concierge-bell', titleTr: 'Hizmetler', titleEn: 'Services', sortOrder: 23 },
  { slug: 'etkinlik-gorgu', icon: 'users', titleTr: 'Etkinlik Görgü', titleEn: 'Event Etiquette', sortOrder: 24 },
  { slug: 'biletfeed-tavsiyeleri', icon: 'sparkles', titleTr: 'Biletfeed Tavsiyeleri', titleEn: 'Biletfeed Tips', sortOrder: 25 }
];
