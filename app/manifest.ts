import type { MetadataRoute } from 'next';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: siteConfig.name,
    short_name: 'BiletFeed',
    description: siteConfig.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#DFFF00',
    lang: 'tr',
    dir: 'ltr',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'lifestyle', 'shopping'],
    prefer_related_applications: true,
    related_applications: [
      {
        platform: 'itunes',
        url: process.env.NEXT_PUBLIC_APP_STORE_URL || `${siteConfig.url}/mobil-uygulama`,
        id: 'com.biletfeed.app'
      },
      {
        platform: 'play',
        url: process.env.NEXT_PUBLIC_PLAY_STORE_URL || `${siteConfig.url}/mobil-uygulama`,
        id: 'com.biletfeed.app'
      }
    ],
    icons: [
      {
        src: brandAssetUrl(brandLogos.favicon),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: brandAssetUrl('/brand/favicon-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: brandAssetUrl('/brand/favicon-192.png'),
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label:
          'BiletFeed mobil — public/brand/screenshot-mobile.png ile değiştirin'
      },
      {
        src: brandAssetUrl(brandLogos.favicon),
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label:
          'BiletFeed masaüstü — public/brand/screenshot-desktop.png ile değiştirin'
      }
    ]
  };
}
