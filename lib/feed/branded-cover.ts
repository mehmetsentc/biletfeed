import sharp from 'sharp';
import type { FeedPostType } from '@prisma/client';
import {
  FEED_CATEGORY_SHORT_LABELS,
  FEED_POST_TYPE_SHORT_LABELS
} from '@/lib/feed/constants';
import {
  isFirebaseStorageUploadConfigured,
  uploadAdminImage
} from '@/lib/firebase/admin-storage';

const COVER_WIDTH = 1200;
const COVER_HEIGHT = 630;
const BG = '#0c1017';
const BRAND = '#f5a623';
const TITLE_COLOR = '#f4f4f5';
const MUTED = '#a1a1aa';

/** Kategori / tip → SVG vurgu rengi (badge Tailwind eşleniği). */
const CATEGORY_ACCENT: Record<string, string> = {
  'konser-haberleri': '#e11d48',
  'festival-haberleri': '#9333ea',
  'muzik-haberleri': '#4f46e5',
  'eglence-haberleri': '#d97706',
  'etkinlik-duyurulari': '#f5a623',
  'trend-hikayeler': '#059669'
};

const TYPE_ACCENT: Partial<Record<FeedPostType, string>> = {
  concert_news: '#e11d48',
  festival_news: '#9333ea',
  music_news: '#4f46e5',
  artist_news: '#7c3aed',
  entertainment_news: '#d97706',
  event_announcement: '#0284c7',
  ticket_alert: '#ea580c',
  trending_story: '#059669'
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(title: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['BiletFeed'];
  const lines: string[] = [];
  let current = '';
  let truncated = false;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length >= maxLines) {
      truncated = true;
      current = '';
      break;
    }
    current = word.length > maxCharsPerLine ? `${word.slice(0, maxCharsPerLine - 1)}…` : word;
  }
  if (current && lines.length < maxLines) lines.push(current);
  else if (current) truncated = true;
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1]!;
    if (!last.endsWith('…')) {
      lines[lines.length - 1] = `${last.slice(0, Math.max(1, maxCharsPerLine - 1))}…`;
    }
  }
  return lines.slice(0, maxLines);
}

function resolveAccent(categorySlug?: string | null, contentType?: FeedPostType | null): string {
  if (categorySlug && CATEGORY_ACCENT[categorySlug]) return CATEGORY_ACCENT[categorySlug];
  if (contentType && TYPE_ACCENT[contentType]) return TYPE_ACCENT[contentType]!;
  return BRAND;
}

function resolveLabel(
  categorySlug?: string | null,
  contentType?: FeedPostType | null
): string {
  if (categorySlug && FEED_CATEGORY_SHORT_LABELS[categorySlug]) {
    return FEED_CATEGORY_SHORT_LABELS[categorySlug];
  }
  if (contentType && FEED_POST_TYPE_SHORT_LABELS[contentType]) {
    return FEED_POST_TYPE_SHORT_LABELS[contentType];
  }
  return 'Gündem';
}

export type BrandedCoverInput = {
  title: string;
  categorySlug?: string | null;
  contentType?: FeedPostType | null;
};

/** Dark BiletFeed marka kapağı — Sharp SVG kompozit (OG boyutları). */
export async function renderBrandedFeedCover(input: BrandedCoverInput): Promise<Buffer> {
  const title = input.title.trim() || 'BiletFeed';
  const accent = resolveAccent(input.categorySlug, input.contentType);
  const label = escapeXml(resolveLabel(input.categorySlug, input.contentType));
  const lines = wrapTitle(title, 28, 3).map(escapeXml);
  const titleFontSize = lines.some((l) => l.length > 24) ? 42 : 48;
  const titleBlockHeight = lines.length * (titleFontSize + 10);
  const titleStartY = Math.round((COVER_HEIGHT - titleBlockHeight) / 2) + titleFontSize;

  const titleTspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : titleFontSize + 10;
      return `<tspan x="72" dy="${dy}">${line}</tspan>`;
    })
    .join('');

  const svg = `
<svg width="${COVER_WIDTH}" height="${COVER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="55%" stop-color="#121821"/>
      <stop offset="100%" stop-color="#0a0e14"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <rect x="0" y="0" width="14" height="100%" fill="${accent}"/>
  <text x="72" y="72" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${BRAND}">BILETFEED</text>
  <rect x="72" y="96" width="48" height="4" rx="2" fill="${accent}"/>
  <text x="72" y="140" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="${MUTED}">${label.toUpperCase()}</text>
  <text x="72" y="${titleStartY}" font-family="Arial, Helvetica, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="${TITLE_COLOR}">${titleTspans}</text>
  <text x="72" y="${COVER_HEIGHT - 48}" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="${MUTED}">biletfeed.com</text>
</svg>`;

  return sharp(Buffer.from(svg))
    .webp({ quality: 86 })
    .toBuffer();
}

/** Marka kapağını üretir ve feed scope’una yükler. Storage yoksa null. */
export async function generateAndUploadBrandedFeedCover(
  input: BrandedCoverInput
): Promise<string | null> {
  if (!isFirebaseStorageUploadConfigured()) return null;
  const title = input.title.trim();
  if (!title) return null;

  try {
    const buffer = await renderBrandedFeedCover(input);
    return await uploadAdminImage('feed', buffer, 'image/webp');
  } catch {
    return null;
  }
}
