import { createHash } from 'crypto';
import { aiChat } from '@/lib/ai/client';
import { FEED_AUTHOR_NAME } from '@/lib/feed/constants';
import type { FeedPostType } from '@prisma/client';

export type DiscoveredItem = {
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet?: string;
  sourceName?: string;
};

export type AiEditorDraft = {
  title: string;
  headline: string;
  summary: string;
  content: string;
  excerpt: string;
  contentType: FeedPostType;
  tags: string[];
  artistName?: string;
  seoTitle: string;
  seoDescription: string;
  readingTimeMinutes: number;
};

const EDITOR_SYSTEM_PROMPT = `Sen BiletFeed AI Editor'sün — Türkiye'nin önde gelen etkinlik keşif platformunun otonom editörüsün.

Görevin: Kamuya açık etkinlik haberlerinden TAMAMEN ORİJİNAL, dergi kalitesinde Türkçe içerik üretmek.

KURALLAR:
- Asla birebir kopyalama yapma
- Kaynak metni yeniden yaz, yeni yapı ve anlatım kullan
- Profesyonel, samimi, modern, hikâye anlatıcı ton
- SEO spam değil, doğal dil
- Her paragraf benzersiz olsun
- Duygusal, ilgi çekici girişler yaz
- Kaynak atfı gerekiyorsa sonuna ekle

ÇIKTI: Yalnızca geçerli JSON döndür.`;

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

export function hashDiscoveryContent(item: DiscoveredItem): string {
  const raw = `${item.sourceUrl}|${item.sourceTitle}|${item.sourceSnippet ?? ''}`;
  return createHash('sha256').update(raw).digest('hex');
}

export async function analyzeDiscoveryItem(item: DiscoveredItem): Promise<{
  isDuplicate: boolean;
  isRelevant: boolean;
  contentType: FeedPostType;
  reason: string;
}> {
  const result = await aiChat(
    [
      { role: 'system', content: EDITOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Bu keşif öğesini analiz et. Etkinlik/müzik/eğlence ile ilgili mi? Hangi içerik türü? JSON döndür:
{"isRelevant":true,"isDuplicate":false,"contentType":"concert_news","reason":"..."}

Kaynak: ${item.sourceName ?? 'Bilinmiyor'}
Başlık: ${item.sourceTitle}
Özet: ${item.sourceSnippet ?? ''}
URL: ${item.sourceUrl}`
      }
    ],
    { temperature: 0.2, maxTokens: 400 }
  );

  try {
    const parsed = JSON.parse(result.content) as {
      isRelevant?: boolean;
      isDuplicate?: boolean;
      contentType?: FeedPostType;
      reason?: string;
    };
    return {
      isRelevant: parsed.isRelevant ?? true,
      isDuplicate: parsed.isDuplicate ?? false,
      contentType: parsed.contentType ?? 'entertainment_news',
      reason: parsed.reason ?? ''
    };
  } catch {
    return {
      isRelevant: true,
      isDuplicate: false,
      contentType: 'entertainment_news',
      reason: 'AI analiz varsayılanı'
    };
  }
}

export async function rewriteDiscoveryItem(
  item: DiscoveredItem,
  contentType: FeedPostType
): Promise<AiEditorDraft> {
  const result = await aiChat(
    [
      { role: 'system', content: EDITOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Bu haberi BiletFeed Feed için orijinal bir makaleye dönüştür. contentType: ${contentType}

JSON formatı:
{
  "title": "Ana başlık",
  "headline": "Alt başlık",
  "summary": "2 cümle özet",
  "content": "Markdown formatında tam makale (en az 4 paragraf)",
  "excerpt": "Kart özeti",
  "tags": ["etiket1","etiket2"],
  "artistName": "varsa sanatçı adı",
  "seoTitle": "SEO başlık",
  "seoDescription": "SEO açıklama"
}

Kaynak: ${item.sourceName ?? ''}
Orijinal başlık: ${item.sourceTitle}
Özet: ${item.sourceSnippet ?? ''}
URL: ${item.sourceUrl}`
      }
    ],
    { temperature: 0.75, maxTokens: 2500 }
  );

  const parsed = JSON.parse(result.content) as Partial<AiEditorDraft>;
  const content = parsed.content?.trim() ?? '';
  return {
    title: parsed.title?.trim() || item.sourceTitle,
    headline: parsed.headline?.trim() || parsed.title?.trim() || item.sourceTitle,
    summary: parsed.summary?.trim() || parsed.excerpt?.trim() || '',
    content,
    excerpt: parsed.excerpt?.trim() || parsed.summary?.trim() || '',
    contentType,
    tags: parsed.tags?.slice(0, 8) ?? [],
    artistName: parsed.artistName?.trim(),
    seoTitle: parsed.seoTitle?.trim() || parsed.title?.trim() || item.sourceTitle,
    seoDescription: parsed.seoDescription?.trim() || parsed.summary?.trim() || '',
    readingTimeMinutes: estimateReadingTime(content)
  };
}

export async function generateEventRecap(event: {
  title: string;
  venue: string;
  city: string;
  date: string;
  description: string;
}): Promise<AiEditorDraft> {
  const result = await aiChat(
    [
      { role: 'system', content: EDITOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Bu etkinlik için "Ne Oldu?" tarzı bir özet makale yaz. Bölümler: Highlights, Atmosfer, Performans Özeti, Mekân Deneyimi, Final İzlenimi.

JSON formatı aynı. contentType: event_recap

Etkinlik: ${event.title}
Mekân: ${event.venue}, ${event.city}
Tarih: ${event.date}
Açıklama: ${event.description.slice(0, 800)}`
      }
    ],
    { temperature: 0.7, maxTokens: 2000 }
  );

  const parsed = JSON.parse(result.content) as Partial<AiEditorDraft>;
  const content = parsed.content?.trim() ?? '';
  return {
    title: parsed.title?.trim() || `${event.title} — Ne Oldu?`,
    headline: parsed.headline?.trim() || 'Etkinlik Özeti',
    summary: parsed.summary?.trim() || '',
    content,
    excerpt: parsed.excerpt?.trim() || '',
    contentType: 'event_recap',
    tags: parsed.tags ?? [event.city.toLowerCase(), 'etkinlik özeti'],
    seoTitle: parsed.seoTitle?.trim() || `${event.title} Etkinlik Özeti`,
    seoDescription: parsed.seoDescription?.trim() || parsed.summary?.trim() || '',
    readingTimeMinutes: estimateReadingTime(content)
  };
}

export const AI_EDITOR_META = {
  name: 'BiletFeed AI Editor',
  author: FEED_AUTHOR_NAME
};
