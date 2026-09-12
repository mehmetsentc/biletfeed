const PRIVATE_HOST =
  /^(localhost|127\.|10\.|0\.|169\.254\.|::1$|\[::1\])|^(172\.(1[6-9]|2\d|3[01])\.)|^(192\.168\.)/i;

const ALLOWED_HOST_SUFFIXES = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'googleusercontent.com',
  'blob.vercel-storage.com',
  'public.blob.vercel-storage.com'
];

function siteHosts(): string[] {
  const hosts: string[] = ['biletfeed.com', 'www.biletfeed.com'];
  for (const raw of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL
  ]) {
    if (!raw) continue;
    try {
      hosts.push(new URL(raw).hostname.toLowerCase());
    } catch {
      /* ignore */
    }
  }
  const bucket = (
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    ''
  )
    .trim()
    .toLowerCase();
  if (bucket) hosts.push(bucket);
  return hosts;
}

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'metadata.google.internal' || host.endsWith('.internal')) {
    return true;
  }
  return PRIVATE_HOST.test(host);
}

export function isAllowedMapImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (isPrivateHostname(host)) return false;
  if (siteHosts().includes(host)) return true;
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

/** Organizatör harita URL’si — SSRF’ye açık iç ağ / metadata adreslerini reddeder */
export function assertSafePublicImageUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Geçersiz görsel adresi');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Harita görseli yalnızca HTTPS olmalıdır');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Geçersiz görsel adresi');
  }
  if (!isAllowedMapImageHost(parsed.hostname)) {
    throw new Error('Harita görseli bu kaynaktan indirilemez');
  }
  return parsed;
}

export async function fetchAllowedImageAsBase64(
  rawUrl: string,
  options?: { maxBytes?: number; timeoutMs?: number }
): Promise<{ mime: string; data: string }> {
  const url = assertSafePublicImageUrl(rawUrl);
  const maxBytes = options?.maxBytes ?? 8 * 1024 * 1024;
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { Accept: 'image/*' }
    });
    const redirected =
      res.status >= 300 &&
      res.status < 400 &&
      res.headers.get('location');
    let finalRes = res;
    if (redirected) {
      const next = assertSafePublicImageUrl(new URL(redirected, url).toString());
      finalRes = await fetch(next, {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
        headers: { Accept: 'image/*' }
      });
    }
    if (!finalRes.ok) throw new Error('Harita görseli indirilemedi');
    const buf = Buffer.from(await finalRes.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw new Error('Harita görseli çok büyük');
    }
    const mime =
      finalRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
    if (!mime.startsWith('image/')) {
      throw new Error('AI için görsel (JPG/PNG/WebP) gerekli — PDF desteklenmez');
    }
    return { mime, data: buf.toString('base64') };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Harita görseli zaman aşımına uğradı');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
