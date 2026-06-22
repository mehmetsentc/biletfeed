import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
