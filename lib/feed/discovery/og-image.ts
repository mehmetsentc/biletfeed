/**
 * Kaynak URL'den og:image / twitter:image meta etiketini çeker.
 * Başarısız olursa null döner — çağıran taraf fallback uygular.
 */
import { resolveImageUrl } from '@/lib/images/normalize-remote-image';

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BiletFeed-Bot/1.0 (news aggregator)',
        Accept: 'text/html'
      },
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) return null;

    // Sadece ilk 50KB'ı oku — <head> kısmı için yeterli
    const reader = response.body?.getReader();
    if (!reader) return null;

    let html = '';
    let bytes = 0;
    while (bytes < 50_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value?.length ?? 0;
      // </head> görününce dur
      if (html.includes('</head>')) break;
    }
    reader.cancel().catch(() => {});

    // og:image
    const ogMatch =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
    if (ogMatch?.[1]) return resolveImageUrl(ogMatch[1], url);

    // twitter:image
    const twMatch =
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i.exec(html);
    if (twMatch?.[1]) return resolveImageUrl(twMatch[1], url);

    return null;
  } catch {
    return null;
  }
}
