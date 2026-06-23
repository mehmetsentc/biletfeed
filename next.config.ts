import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://accounts.google.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://www.google.com wss://*.firebaseio.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://apis.google.com https://www.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com https://*.firebaseapp.com",
      "frame-ancestors 'none'"
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          { key: 'Content-Security-Policy', value: csp }
        ]
      },
      {
        source: '/giris',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      },
      {
        source: '/kayit',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/organizator-panel/baslangic',
        permanent: false
      },
      {
        source: '/dashboard/:path*',
        destination: '/organizator-panel/:path*',
        permanent: false
      }
    ];
  },
  // Proje kökünü sabitle — /Users/user/package-lock.json yanlış root seçimine neden oluyordu
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname)
  },
  serverExternalPackages: ['firebase-admin', '@prisma/client', 'prisma'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns']
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Bozuk disk cache → ETIMEDOUT; dev'de cache kapat
      config.cache = false;
    }
    return config;
  },
  images: {
    // Scraper'dan gelen harici platform resimleri production'da da direkt yüklensin
    unoptimized: true,
    remotePatterns: [
      // Firebase Storage
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      // Bubilet
      { protocol: 'https', hostname: 'cdn.bubilet.com.tr' },
      { protocol: 'https', hostname: 'www.bubilet.com.tr' },
      { protocol: 'https', hostname: 'bubilet.com.tr' },
      // Biletix
      { protocol: 'https', hostname: 'www.biletix.com' },
      { protocol: 'https', hostname: 'biletix.com' },
      { protocol: 'https', hostname: 'cdn.biletix.com' },
      { protocol: 'https', hostname: 'images.biletix.com' },
      { protocol: 'https', hostname: 'img.biletix.com' },
      { protocol: 'https', hostname: 'static.biletix.com' },
      // Passo
      { protocol: 'https', hostname: 'passo.com.tr' },
      { protocol: 'https', hostname: 'www.passo.com.tr' },
      { protocol: 'https', hostname: 'cdn.passo.com.tr' },
      { protocol: 'https', hostname: 'images.passo.com.tr' },
      { protocol: 'https', hostname: 'img.passo.com.tr' },
      { protocol: 'https', hostname: 'image.passo.com.tr' },  // API image CDN
      // Biletino
      { protocol: 'https', hostname: 'www.biletino.com' },
      { protocol: 'https', hostname: 'biletino.com' },
      { protocol: 'https', hostname: 'cdn.biletino.com' },
      { protocol: 'https', hostname: 'images.biletino.com' },
      // Biletino S3 (etkinlik görselleri buradan geliyor)
      { protocol: 'https', hostname: 'resources-biletino.s3.eu-west-1.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.eu-west-1.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      {
        protocol: 'https',
        hostname: 'resources-biletino.s3.eu-west-1.amazonaws.com'
      },
      {
        protocol: 'https',
        hostname: 'resources-biletino.s3-eu-west-1.amazonaws.com'
      },
      // Biletimo
      { protocol: 'https', hostname: 'www.biletimo.com' },
      { protocol: 'https', hostname: 'biletimo.com' },
      { protocol: 'https', hostname: 'cdn.biletimo.com' },
      // Genel CDN'ler
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.imgur.com' }
    ]
  }
};

export default nextConfig;
