import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppSpeedInsights } from '@/components/analytics/speed-insights';
import { Providers } from '@/components/providers';
import { ThemeInitScript } from '@/components/theme/theme-init-script';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';
import { JsonLd } from '@/lib/seo/json-ld';
import { createPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildWebsiteSchema } from '@/lib/seo/schemas';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  ...createPageMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: '/'
  }),
  icons: {
    icon: [
      { url: brandAssetUrl(brandLogos.favicon), type: 'image/png', sizes: '512x512' },
      {
        url: brandAssetUrl('/brand/favicon-192.png'),
        type: 'image/png',
        sizes: '192x192'
      }
    ],
    apple: [{ url: brandAssetUrl(brandLogos.favicon), type: 'image/png' }],
    shortcut: brandAssetUrl(brandLogos.favicon)
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  colorScheme: 'light dark'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <JsonLd
          data={[buildOrganizationSchema(), buildWebsiteSchema()]}
        />
        <Providers>{children}</Providers>
        <AppSpeedInsights />
      </body>
    </html>
  );
}
