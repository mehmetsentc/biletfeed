import type { MetadataRoute } from 'next';
import { brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'BiletFeed',
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FF9100',
    lang: 'tr',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'lifestyle'],
    icons: [
      {
        src: brandLogos.favicon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/brand/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
