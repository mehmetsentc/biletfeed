import type { Metadata, Viewport } from 'next';
import { AppSpeedInsights } from '@/components/analytics/speed-insights';
import { Providers } from '@/components/providers';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';
import { JsonLd } from '@/lib/seo/json-ld';
import { createPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildWebsiteSchema } from '@/lib/seo/schemas';
import './globals.css';

export const metadata: Metadata = {
  ...createPageMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: '/'
  }),
  icons: {
    icon: [
      { url: brandAssetUrl(brandLogos.favicon), type: 'image/png', sizes: '1000x1000' },
      { url: '/brand/favicon-192.png', type: 'image/png', sizes: '192x192' }
    ],
    apple: [{ url: brandAssetUrl(brandLogos.favicon), type: 'image/png' }],
    shortcut: brandAssetUrl(brandLogos.favicon)
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  colorScheme: 'dark light'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <JsonLd
          data={[buildOrganizationSchema(), buildWebsiteSchema()]}
        />
        <Providers>{children}</Providers>
        <AppSpeedInsights />
      </body>
    </html>
  );
}
