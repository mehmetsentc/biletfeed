import { getStorage } from 'firebase-admin/storage';
import { getAdminApp, isFirebaseAdminConfigured } from '@/lib/firebase/admin';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function getBucketName(): string | undefined {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
}

export function isFirebaseStorageUploadConfigured(): boolean {
  return isFirebaseAdminConfigured() && Boolean(getBucketName());
}

/**
 * Scraper / sunucu tarafı kapak görseli yükler.
 * Path: events/{platform}/{eventId}/cover.{ext}
 * FIREBASE_SERVICE_ACCOUNT_JSON veya firebase-admin.json gerekir.
 */
export async function uploadEventCoverFromBuffer(
  platform: string,
  eventId: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (!isFirebaseStorageUploadConfigured()) {
    throw new Error('Firebase Storage yapılandırılmamış');
  }

  const bucketName = getBucketName()!;
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';
  const path = `events/${platform.toLowerCase()}/${eventId}/cover.${ext}`;

  const bucket = getStorage(getAdminApp()).bucket(bucketName);
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000'
    },
    public: true
  });

  return `https://storage.googleapis.com/${bucketName}/${path}`;
}

export async function downloadAndUploadEventCover(
  platform: string,
  eventId: string,
  sourceUrl: string
): Promise<string | null> {
  if (!sourceUrl.startsWith('http') || !isFirebaseStorageUploadConfigured()) {
    return null;
  }

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BiletFeedBot/1.0; +https://biletfeed.com)',
        Accept: 'image/*'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) return null;

    return uploadEventCoverFromBuffer(platform, eventId, buffer, contentType);
  } catch {
    return null;
  }
}
