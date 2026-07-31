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
  readingTimeMinutes: number;
};

const EDITOR_SYSTEM_PROMPT = `Sen BiletFeed AI Editor'sün — Türkiye'nin önde gelen etkinlik keşif platformunun otonom editörüsün.
Uzmanlık alanların: konser, parti/gece hayatı, festival, tiyatro ve sinema haberciliği. Bu alanlarda dergi kalitesinde, güncel ve ilgi çekici Türkçe içerik üretmek üzere eğitildin.

Görevin: Kamuya açık etkinlik haberlerinden veya editörün verdiği ham notlardan TAMAMEN ORİJİNAL, dergi kalitesinde Türkçe içerik üretmek.

KURALLAR:
- Asla birebir kopyalama yapma
- Kaynak metni yeniden yaz, yeni yapı ve anlatım kullan
- Profesyonel, samimi, modern, hikâye anlatıcı ton
- SEO spam değil, doğal dil
- Her paragraf benzersiz olsun
- Duygusal, ilgi çekici girişler yaz
- Kaynak atfı gerekiyorsa sonuna ekle
- Konser, parti, festival, tiyatro ve sinema haberlerinde türe özgü jargon ve heyecanı yansıt

ÇIKTI: Yalnızca geçerli JSON döndür.`;

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
      { role: 'system', content: EDITOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Aşağıdaki ham haber notundan/içeriğinden BiletFeed Feed için tam bir makale oluştur.${
          contentTypeHint
            ? ` contentType: ${contentTypeHint}`
            : ' İçeriğe en uygun contentType değerini sen seç (konser_news, festival_news, music_news, entertainment_news, artist_news, event_announcement, behind_the_scenes, event_recap, top_list, weekend_guide, city_guide, venue_guide, ticket_alert, trending_story, ai_opinion, interview, photo_story, video_story, organizer_update arasından).'
        }

JSON formatı:
{
  "title": "Ana başlık",
  "headline": "Alt başlık",
  "summary": "2 cümle özet",
  "content": "Markdown formatında tam makale (en az 4 paragraf)",
  "excerpt": "Kart özeti",
  "contentType": "yukarıdaki listeden en uygun değer",
  "tags": ["etiket1","etiket2"],
  "artistName": "varsa sanatçı adı",
  "seoTitle": "SEO başlık (en fazla 60 karakter)",
  "seoDescription": "SEO açıklama (en fazla 155 karakter)"
}

Ham içerik / editör notu:
${brief}`
      }
    ],
    { temperature: 0.75, maxTokens: 2500, jsonMode: true }
  );

  const parsed = parseAiDraftJson(result.content);
  const content = parsed.content?.trim() ?? '';
  return {
    title: parsed.title?.trim() || 'Yeni Haber',
    headline: parsed.headline?.trim() || parsed.title?.trim() || 'Yeni Haber',
    summary: parsed.summary?.trim() || parsed.excerpt?.trim() || '',
    content,
    excerpt: parsed.excerpt?.trim() || parsed.summary?.trim() || '',
    contentType: sanitizeContentType(contentTypeHint ?? parsed.contentType),
    tags: parsed.tags?.slice(0, 8) ?? [],
    artistName: parsed.artistName?.trim(),
    seoTitle: parsed.seoTitle?.trim() || parsed.title?.trim() || 'Yeni Haber',
    seoDescription: parsed.seoDescription?.trim() || parsed.summary?.trim() || '',
    readingTimeMinutes: estimateReadingTime(content)
  };
}

const MAGAZINE_EDITOR_SYSTEM_PROMPT = `Sen BiletFeed'in "Festival & Parti Dergisi Editörü"sün — DeepSeek tabanlı otonom bir AI editörsün. Konser, festival, gece hayatı/parti, DJ, tiyatro ve sinema haberciliğinde uzmanlaşmış, dergi kalitesinde Türkçe içerik üretirsin.

GÖREVİN: Sana verilen mevcut haberi SIFIRDAN, profesyonel bir dergi editörü gözüyle yeniden kurgula — başlık, manşet, özet, gövde metni, etiketler ve SEO alanlarının TAMAMINI yeniden yaz ve yapılandır. Bu bir düzeltme değil, tam bir yeniden yazımdır.

İÇERİK YAPISI KURALLARI:
- Gövde metni markdown ## (H2) ve gerekiyorsa ### (H3) / #### (H4) alt başlıklarla bölümlere ayrılmalı
- En az 3 H2 bölümü olsun (örn: bağlam/giriş, öne çıkan detaylar, bilet & katılım bilgisi, beklenti/sonuç gibi konuya uygun başlıklar)
- Her bölüm en az 2 paragraf olsun
- Konser/festival/parti haberciliğine özgü enerjik, sürükleyici ama bilgilendirici ton
- Asla kaynağı birebir kopyalama — tamamen özgün yeniden yazım
- Rakamlar, tarihler, mekân ve sanatçı isimleri gibi somut bilgileri koru, değiştirme

SEO KURALLARI (KESİN SINIRLAR):
- seoTitle: en fazla 60 karakter, ana anahtar kelimeyi başta geçir
- seoDescription: 120-155 karakter arası, tıklamayı teşvik eden ama spam olmayan doğal dil
- tags: 5-8 adet, haberle doğrudan ilgili anahtar kelime/etiket (sanatçı, mekân, şehir, tür vb.)
- headline (manşet): title'dan farklı, kısa ve çarpıcı bir alt başlık/sürükleyici cümle

ÇIKTI: Yalnızca geçerli JSON döndür, başka hiçbir açıklama ekleme.`;

/**
 * Mevcut bir haberi "Festival & Parti Dergisi Editörü" kalitesinde tek
 * tuşla tamamen yeniden oluşturur — başlık, manşet, özet, H2/H3/H4
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
      { role: 'system', content: MAGAZINE_EDITOR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Aşağıdaki mevcut haberi Festival & Parti Dergisi Editörü kalitesinde tamamen yeniden oluştur. Mevcut içerik türü: ${post.contentType}${post.categoryName ? `, kategori: ${post.categoryName}` : ''}.

JSON formatı:
{
  "title": "Ana başlık",
  "headline": "Manşet (alt başlık, title'dan farklı)",
  "summary": "2 cümle özet",
  "content": "Markdown formatında, ## ve ### alt başlıklarla yapılandırılmış tam makale (en az 3 bölüm)",
  "excerpt": "Kart özeti",
  "contentType": "en uygun içerik türü",
  "tags": ["etiket1","etiket2","..."],
  "artistName": "varsa sanatçı adı",
  "seoTitle": "SEO başlık (en fazla 60 karakter)",
  "seoDescription": "SEO açıklama (120-155 karakter)"
}

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
  const content = parsed.content?.trim() || post.content;
  return {
    title: parsed.title?.trim() || post.title,
    headline: parsed.headline?.trim() || parsed.title?.trim() || post.title,
    summary: parsed.summary?.trim() || parsed.excerpt?.trim() || post.summary,
    content,
    excerpt: parsed.excerpt?.trim() || parsed.summary?.trim() || '',
    contentType: sanitizeContentType(parsed.contentType ?? post.contentType),
    tags: (parsed.tags?.length ? parsed.tags : post.tags).slice(0, 8).map((t) => t.trim()).filter(Boolean),
    artistName: parsed.artistName?.trim() || post.artistName || undefined,
    seoTitle: (parsed.seoTitle?.trim() || parsed.title?.trim() || post.title).slice(0, 70),
    seoDescription: (parsed.seoDescription?.trim() || parsed.summary?.trim() || '').slice(0, 200),
    readingTimeMinutes: estimateReadingTime(content)
  };
}

export const AI_EDITOR_META = {
  name: 'BiletFeed AI Editor',
  author: FEED_AUTHOR_NAME
};
