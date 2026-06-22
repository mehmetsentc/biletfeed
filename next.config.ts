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
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com'
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/biletfeed.firebasestorage.app/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.bubilet.com.tr'
      },
      {
        protocol: 'https',
        hostname: 'www.bubilet.com.tr'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  }
};

export default nextConfig;
