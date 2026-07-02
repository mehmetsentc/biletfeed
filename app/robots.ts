import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { isEventJoyEnabled } from '@/lib/config/features';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  const disallow = [
    '/dashboard/',
    '/organizator-panel/',
    '/admin/',
    '/api/',
    '/giris',
    '/kayit',
    '/sifremi-unuttum',
    '/odeme/',
    '/profil',
    '/biletlerim',
    '/favorilerim',
    '/ilgi-alanlari',
    '/bildirimler'
  ];

  if (isEventJoyEnabled) {
    disallow.splice(4, 0, '/eventjoy/');
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
