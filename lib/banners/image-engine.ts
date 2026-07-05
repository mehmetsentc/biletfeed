import sharp from 'sharp';
import { BANNER_DIMENSIONS } from '@/lib/banners/hero-slide-types';

const BRAND_ORANGE = '#EB672B';

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(12_000),
    headers: { 'User-Agent': 'BiletFeed-BannerEngine/1.0' }
  });
  if (!res.ok) {
    throw new Error(`Görsel indirilemedi: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function accentSvg(width: number, height: number): Buffer {
  const leftW = Math.round(width * 0.08);
  const rightW = Math.round(width * 0.06);
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000" stop-opacity="0.75"/>
          <stop offset="45%" stop-color="#000" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <polygon points="0,0 ${leftW},0 0,${height}" fill="${BRAND_ORANGE}" opacity="0.95"/>
      <polygon points="${width},0 ${width - rightW},0 ${width},${height}" fill="${BRAND_ORANGE}" opacity="0.85"/>
      <rect width="${width}" height="${height}" fill="url(#fade)"/>
    </svg>`;
  return Buffer.from(svg);
}

export type BannerVariant = keyof typeof BANNER_DIMENSIONS;

/**
 * Etkinlik afişini banner ölçüsüne kırpar, blur arka plan + marka vurgusu ekler.
 * AI gerekmez — Sharp ile sunucu tarafı kompozit.
 */
export async function renderEventBannerImage(
  coverImageUrl: string,
  variant: BannerVariant
): Promise<Buffer> {
  const { width, height } = BANNER_DIMENSIONS[variant];
  const source = await fetchImageBuffer(coverImageUrl);

  const background = await sharp(source)
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .blur(18)
    .modulate({ brightness: 0.55, saturation: 1.1 })
    .toBuffer();

  const foreground = await sharp(source)
    .resize(Math.round(width * 0.72), height, {
      fit: 'contain',
      position: 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  const accent = accentSvg(width, height);

  const fgLeft = Math.round((width - Math.round(width * 0.72)) / 2);

  return sharp(background)
    .composite([
      { input: foreground, left: fgLeft, top: 0 },
      { input: accent, left: 0, top: 0 }
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export async function renderEventBannerVariants(
  coverImageUrl: string
): Promise<Record<BannerVariant, Buffer>> {
  const variants = Object.keys(BANNER_DIMENSIONS) as BannerVariant[];
  const entries = await Promise.all(
    variants.map(async (variant) => {
      const buffer = await renderEventBannerImage(coverImageUrl, variant);
      return [variant, buffer] as const;
    })
  );
  return Object.fromEntries(entries) as Record<BannerVariant, Buffer>;
}
