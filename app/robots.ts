import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/organizator-panel/',
          '/admin/',
          '/api/',
          '/eventjoy/',
          '/giris',
          '/kayit',
          '/sifremi-unuttum',
          '/odeme/',
          '/profil',
          '/biletlerim',
          '/favorilerim',
          '/ilgi-alanlari',
          '/bildirimler'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
