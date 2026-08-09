import { createHash } from 'crypto';
import { aiChat } from '@/lib/ai/client';
import { FEED_AUTHOR_NAME } from '@/lib/feed/constants';
import type { FeedPostType } from '@prisma/client';

const VALID_CONTENT_TYPES: FeedPostType[] = [
  'concert_news', 'festival_news', 'music_news', 'entertainment_news',
  'artist_news', 'event_announcement', 'behind_the_scenes', 'event_recap',
  'top_list', 'weekend_guide', 'city_guide', 'venue_guide', 'ticket_alert',
  'trending_story', 'ai_opinion', 'interview', 'photo_story', 'video_story',
  'organizer_update'
];

function sanitizeContentType(raw: unknown): FeedPostType {
  if (typeof raw === 'string' && VALID_CONTENT_TYPES.includes(raw as FeedPostType)) {
    return raw as FeedPostType;
  }
  return 'entertainment_news';
}

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
  seoKeywords: string[];
  readingTimeMinutes: number;
};

/** FAZ 2 için hazırlık — kategoriye özel ton/yapı ekleri (temel prompta eklenir). */
export const CATEGORY_SPECIALTY_PROMPTS: Partial<Record<FeedPostType, string>> = {
  concert_news: `KONSER ODAKLI:
- Sahne enerjisi, setlist beklentisi, mekân akustiği ve bilet durumunu öne çıkar
- H2 örnekleri: "Sahne Öncesi", "Neyi Beklemeli?", "Bilet ve Katılım"`,
  entertainment_news: `PARTİ / GECE HAYATI ODAKLI:
- Atmosfer, DJ/line-up, giriş saatleri ve şehir gece kültürü vurgula
- H2 örnekleri: "Geceye Dair", "Kim Sahne Alıyor?", "Nasıl Katılınır?"`,
  festival_news: `FESTİVAL ODAKLI:
- Line-up, sahne düzeni, kamp/ulaşım ve öne çıkan günleri yapılandır
- H2 örnekleri: "Programın Nabzı", "Öne Çıkan İsimler", "Pratik Bilgiler"`
};

function specialtyAddon(contentType: FeedPostType): string {
  return CATEGORY_SPECIALTY_PROMPTS[contentType]
    ? `\n\n${CATEGORY_SPECIALTY_PROMPTS[contentType]}`
    : '';
}

const EDITOR_SYSTEM_PROMPT = `Sen BiletFeed AI Editörüsün — Türkiye'nin etkinlik keşif platformunun otonom editörüsün.
Uzmanlık: konser, parti/gece hayatı, festival, tiyatro ve sinema haberciliği.
Yalnızca Türkçe yaz. İngilizce başlık, bölüm adı veya kalıp kullanma (ör. "Highlights", "What to Expect" yasak).

Görevin: Kamuya açık etkinlik haberlerinden veya editör notlarından TAMAMEN ORİJİNAL, dergi kalitesinde Türkçe içerik üretmek.

DİL VE TON:
- Sadece Türkçe
- Profesyonel, samimi, modern, hikâye anlatıcı
- SEO spam değil, doğal dil
- Konser / parti / festival jargonunu Türkçe kullan

GÖVDE YAPISI (content alanı — markdown):
- İlk blok: giriş (lead) paragrafı — başlık tekrarı YOK
- En az 3 adet ## (H2) alt başlık; # (H1) KULLANMA
- Gerekiyorsa ### kullanabilirsin
- En az bir madde veya numaralı liste (- veya 1.)
- title alanındaki ana başlığı gövdede # ile tekrarlama
- En az 4 paragraf toplam

SEO:
- seoTitle: en fazla 60 karakter, ana anahtar kelimeyi önde
- seoDescription: 120–155 karakter, tıklamayı teşvik eden doğal dil
- seoKeywords: 4–8 adet Türkçe anahtar kelime (dizi)

KAPAK / YAYIN NOTU (meta — JSON dışında da bilin):
- Kapak görseli mümkünse kaynak görselinden gelmeli
- Kapak yoksa içerik taslak/incelemede kalmalı; otomatik öne çıkarma yapılmaz

KURALLAR:
- Asla birebir kopyalama
- Kaynak metni yeniden yaz, yeni yapı kullan
- Her paragraf benzersiz olsun
- Kaynak atfı gerekiyorsa en sonda belirt

ÇIKTI: Yalnızca geçerli JSON döndür.`;

const JSON_SHAPE = `{
  "title": "Ana başlık (Türkçe)",
  "headline": "Manşet — title'dan farklı kısa alt başlık",
  "summary": "2 cümle özet",
  "content": "Markdown gövde: lead paragraf + en az 3 ## bölüm + en az bir liste. # kullanma.",
  "excerpt": "Kart özeti",
  "tags": ["etiket1","etiket2"],
  "artistName": "varsa sanatçı adı",
  "seoTitle": "SEO başlık (max 60 karakter)",
  "seoDescription": "SEO açıklama (120-155 karakter)",
  "seoKeywords": ["anahtar1","anahtar2","anahtar3","anahtar4"]
}`;

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

/** AI yanıtı bazen kod bloğu veya ek metinle sarmalanmış JSON döndürebilir — toleranslı parse. */
function parseAiDraftJson(raw: string): Partial<AiEditorDraft> {
  try {
    return JSON.parse(raw) as Partial<AiEditorDraft>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI JSON parse hatası');
    return JSON.parse(match[0]) as Partial<AiEditorDraft>;
  }
}

/** Gövdeye sızmış H1 (`# ...`) satırlarını temizler — yalnızca ## / ### kalır. */
function stripLeakedH1(content: string): string {
  return content
    .split('\n')
    .filter((line) => !/^#\s+/.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeKeywords(raw: unknown, fallbackTags: string[]): string[] {
  const fromAi = Array.isArray(raw)
    ? raw.filter((k): k is string => typeof k === 'string').map((k) => k.trim()).filter(Boolean)
    : [];
  const merged = (fromAi.length > 0 ? fromAi : fallbackTags).slice(0, 8);
  return merged;
}

function finalizeDraft(
  parsed: Partial<AiEditorDraft>,
  defaults: { title: string; contentType: FeedPostType; tags?: string[] }
): AiEditorDraft {
  const title = parsed.title?.trim() || defaults.title;
  const content = stripLeakedH1(parsed.content?.trim() ?? '');
  const tags = parsed.tags?.slice(0, 8) ?? defaults.tags ?? [];
  return {
    title,
    headline: parsed.headline?.trim() || title,
    summary: parsed.summary?.trim() || parsed.excerpt?.trim() || '',
    content,
    excerpt: parsed.excerpt?.trim() || parsed.summary?.trim() || '',
    contentType: sanitizeContentType(parsed.contentType ?? defaults.contentType),
    tags,
    artistName: parsed.artistName?.trim(),
    seoTitle: (parsed.seoTitle?.trim() || title).slice(0, 70),
    seoDescription: (parsed.seoDescription?.trim() || parsed.summary?.trim() || '').slice(0, 200),
    seoKeywords: normalizeKeywords(parsed.seoKeywords, tags),
    readingTimeMinutes: estimateReadingTime(content)
  };
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
        content: `Bu keşif öğesini analiz et. Etkinlik/müzik/eğlence ile ilgili mi? Hangi içerik türü? Yalnızca Türkçe reason yaz. JSON döndür:
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
      contentType: sanitizeContentType(parsed.contentType),
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
      { role: 'system', content: EDITOR_SYSTEM_PROMPT + specialtyAddon(contentType) },
      {
        role: 'user',
        content: `Bu haberi BiletFeed Feed için orijinal bir makaleye dönüştür. contentType: ${contentType}

JSON formatı:
${JSON_SHAPE}

Kaynak: ${item.sourceName ?? ''}
Orijinal başlık: ${item.sourceTitle}
Özet: ${item.sourceSnippet ?? ''}
URL: ${item.sourceUrl}`
      }
    ],
    { temperature: 0.75, maxTokens: 2500, jsonMode: true }
  );

  const parsed = parseAiDraftJson(result.content);
  return finalizeDraft(parsed, { title: item.sourceTitle, contentType });
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
        content: `Bu etkinlik için "Ne Oldu?" tarzı bir özet makale yaz. Bölümler Türkçe olsun (ör. Öne Çıkanlar, Atmosfer, Performans Özeti, Mekân Deneyimi, Final İzlenimi). contentType: event_recap

JSON formatı:
${JSON_SHAPE}

Etkinlik: ${event.title}
Mekân: ${event.venue}, ${event.city}
Tarih: ${event.date}
Açıklama: ${event.description.slice(0, 800)}`
      }
    ],
    { temperature: 0.7, maxTokens: 2000, jsonMode: true }
  );

  const parsed = parseAiDraftJson(result.content);
  return finalizeDraft(parsed, {
    title: `${event.title} — Ne Oldu?`,
    contentType: 'event_recap',
    tags: [event.city.toLowerCase(), 'etkinlik özeti']
  });
}

/**
 * Editörün admin panelden girdiği ham haber içeriği/notundan sıfırdan tam bir
 * makale taslağı üretir. `rewriteDiscoveryItem`'dan farkı: kaynak URL/keşif
 * öğesi yerine doğrudan serbest metin girdisi kullanır.
 */
export async function generateArticleFromBrief(
  brief: string,
  contentTypeHint?: FeedPostType
): Promise<AiEditorDraft> {
  const result = await aiChat(
    [
      {
        role: 'system',
        content: EDITOR_SYSTEM_PROMPT + (contentTypeHint ? specialtyAddon(contentTypeHint) : '')
      },
      {
        role: 'user',
        content: `Aşağıdaki ham haber notundan/içeriğinden BiletFeed Feed için tam bir makale oluştur.${
          contentTypeHint
            ? ` contentType: ${contentTypeHint}`
            : ' İçeriğe en uygun contentType değerini sen seç (concert_news, festival_news, music_news, entertainment_news, artist_news, event_announcement, behind_the_scenes, event_recap, top_list, weekend_guide, city_guide, venue_guide, ticket_alert, trending_story, ai_opinion, interview, photo_story, video_story, organizer_update arasından).'
        }

JSON formatı:
${JSON_SHAPE.replace(
  '"artistName"',
  '"contentType": "yukarıdaki listeden en uygun değer",\n  "artistName"'
)}

Ham içerik / editör notu:
${brief}`
      }
    ],
    { temperature: 0.75, maxTokens: 2500, jsonMode: true }
  );

  const parsed = parseAiDraftJson(result.content);
  return finalizeDraft(parsed, {
    title: 'Yeni Haber',
    contentType: contentTypeHint ?? sanitizeContentType(parsed.contentType)
  });
}

const MAGAZINE_EDITOR_SYSTEM_PROMPT = `${EDITOR_SYSTEM_PROMPT}

EK ROL — Festival & Parti Dergisi Editörü:
Görevin mevcut haberi SIFIRDAN yeniden kurgulamak. Düzeltme değil, tam yeniden yazım.
Her H2 bölümünde en az 2 paragraf olsun.
Rakamlar, tarihler, mekân ve sanatçı isimleri gibi somut bilgileri koru.`;

/**
 * Mevcut bir haberi "Festival & Parti Dergisi Editörü" kalitesinde tek
 * tuşla tamamen yeniden oluşturur — başlık, manşet, özet, H2/H3
 * yapılandırılmış gövde metni, etiketler ve SEO alanlarının tümü DeepSeek
 * ile yeniden yazılır. Admin düzenleme ekranındaki "AI ile Yeniden Oluştur"
 * butonu tarafından kullanılır.
 */
export async function regeneratePostAsMagazineEditor(post: {
  title: string;
  headline?: string | null;
  summary: string;
  content: string;
  contentType: FeedPostType;
  tags: string[];
  artistName?: string | null;
  categoryName?: string | null;
}): Promise<AiEditorDraft> {
  const result = await aiChat(
    [
      {
        role: 'system',
        content: MAGAZINE_EDITOR_SYSTEM_PROMPT + specialtyAddon(post.contentType)
      },
      {
        role: 'user',
        content: `Aşağıdaki mevcut haberi Festival & Parti Dergisi Editörü kalitesinde tamamen yeniden oluştur. Mevcut içerik türü: ${post.contentType}${post.categoryName ? `, kategori: ${post.categoryName}` : ''}.

JSON formatı:
${JSON_SHAPE.replace(
  '"artistName"',
  '"contentType": "en uygun içerik türü",\n  "artistName"'
)}

MEVCUT BAŞLIK: ${post.title}
MEVCUT MANŞET: ${post.headline ?? ''}
MEVCUT ÖZET: ${post.summary}
MEVCUT ETİKETLER: ${post.tags.join(', ')}
${post.artistName ? `SANATÇI: ${post.artistName}` : ''}

MEVCUT İÇERİK:
${post.content.slice(0, 6000)}`
      }
    ],
    { provider: 'deepseek', temperature: 0.8, maxTokens: 3000, jsonMode: true }
  );

  const parsed = parseAiDraftJson(result.content);
  return finalizeDraft(
    { ...parsed, content: parsed.content?.trim() || post.content },
    { title: post.title, contentType: post.contentType, tags: post.tags }
  );
}

export const AI_EDITOR_META = {
  name: 'BiletFeed AI Editör',
  author: FEED_AUTHOR_NAME
};
