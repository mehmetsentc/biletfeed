import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { AppSpeedInsights } from '@/components/analytics/speed-insights';
import { AppUpdateChecker } from '@/components/app-update-checker';
import { CapacitorSplashOverlay } from '@/components/capacitor-splash-overlay';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { SiteTracker } from '@/components/analytics/site-tracker';
import { InstallAppBanner } from '@/components/install-app-banner';
import { Providers } from '@/components/providers';
import { ThemeInitScript } from '@/components/theme/theme-init-script';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { APPLE_APP_STORE_NUMERIC_ID } from '@/lib/config/mobile-app';
import { siteConfig } from '@/lib/config/site';
import { LOCALE_HTML_LANG } from '@/lib/i18n';
import { getServerLocale } from '@/lib/i18n/server';
import { JsonLd } from '@/lib/seo/json-ld';
import { createPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizationSchema, buildWebsiteSchema } from '@/lib/seo/schemas';
import { Suspense } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
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
  },
  other: {
    // iOS Safari "Smart App Banner" — uygulama yüklüyse "Aç", değilse
    // "Yükle" butonuyla üstte küçük native bir şerit gösterir.
    'apple-itunes-app': `app-id=${APPLE_APP_STORE_NUMERIC_ID}`
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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={LOCALE_HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className={`${GeistSans.variable} ${inter.variable} font-sans antialiased`}>
        <CapacitorSplashOverlay />
        <AppUpdateChecker />
        <InstallAppBanner />
        <JsonLd
          data={[buildOrganizationSchema(), buildWebsiteSchema()]}
        />
        <Providers locale={locale}>{children}</Providers>
        <Suspense fallback={null}>
          <SiteTracker />
        </Suspense>
        <AppSpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
