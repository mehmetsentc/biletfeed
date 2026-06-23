import { siteConfig } from '@/lib/config/site';

/** Platform iletişim bilgileri — organizatör paneli ve site genelinde kullanılır */
export const platformContact = {
  companyName: siteConfig.name,
  email: 'destek@biletfeed.com',
  phone: '0541 953 93 00',
  phoneE164: '905419539300',
  whatsappUrl: 'https://wa.me/905419539300',
  address:
    'Hurma Mah. 246 Sk. Adalın Park No:9 Kat:2 Konyaaltı / Antalya',
  supportHours: 'Hafta içi 09:00 – 18:00'
} as const;

export type PlatformContact = typeof platformContact;
