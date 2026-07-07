import sharp from 'sharp';
import {
  isFirebaseStorageUploadConfigured,
  uploadAdminImage
} from '@/lib/firebase/admin-storage';

const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

const SKIP_HOSTS = new Set(['biletfeed.com', 'www.biletfeed.com']);

function isAlreadyNormalized(url: string): boolean {
  if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
    return true;
  }
  if (url.includes('/brand/logo')) return true;
  return false;
}

function resolveImageUrl(raw: string, baseUrl: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'BiletFeed-ImageBot/1.0 (+https://biletfeed.com)',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
    },
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`Görsel indirilemedi (${res.status})`);
  }

  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  if (contentType.startsWith('text/') || contentType.includes('html')) {
    throw new Error('URL bir görsel değil');
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) throw new Error('Boş görsel');
  if (buffer.length > MAX_BYTES) throw new Error('Görsel çok büyük');

  return { buffer, contentType };
}

/**
 * Harici görseli indirir, WebP'ye dönüştürür ve Firebase'e yükler.
 * Başarısız olursa null döner — çağıran fallback uygular.
 */
export async function normalizeRemoteImageToStorage(
  sourceUrl: string,
  scope: 'feed' | 'events' = 'feed'
): Promise<string | null> {
  if (!sourceUrl?.startsWith('http')) return null;
  if (!isFirebaseStorageUploadConfigured()) return null;
  if (isAlreadyNormalized(sourceUrl)) return sourceUrl;

  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
    if (SKIP_HOSTS.has(host)) return sourceUrl;
  } catch {
    return null;
  }

  try {
    const { buffer } = await fetchImageBuffer(sourceUrl);

    const webp = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return await uploadAdminImage(scope, webp, 'image/webp');
  } catch {
    try {
      const { buffer } = await fetchImageBuffer(sourceUrl);
      const jpeg = await sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      return await uploadAdminImage(scope, jpeg, 'image/jpeg');
    } catch {
      return null;
    }
  }
}

export async function normalizeCoverImageUrl(
  coverUrl: string | null | undefined,
  sourcePageUrl?: string
): Promise<string | null> {
  if (!coverUrl?.trim()) return null;

  let resolved = coverUrl.trim();
  if (sourcePageUrl && !resolved.startsWith('http')) {
    resolved = resolveImageUrl(resolved, sourcePageUrl);
  }

  if (!resolved.startsWith('http')) return null;

  const normalized = await normalizeRemoteImageToStorage(resolved, 'feed');
  return normalized ?? resolved;
}

export { resolveImageUrl };
