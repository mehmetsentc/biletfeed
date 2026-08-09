import { createHash } from 'crypto';
import { aiChat } from '@/lib/ai/client';
import { FEED_AUTHOR_NAME } from '@/lib/feed/constants';
import {
  BASE_SYSTEM_PROMPT,
  buildDraftUserPrompt,
  regenerateWithCategoryEditor,
  resolveFeedEditor,
  runFeedEditor,
  sanitizeContentType,
  type AiEditorDraft,
  type FeedEditorId
} from '@/lib/feed/editors';
import type { FeedPostType } from '@prisma/client';

export type { AiEditorDraft, FeedEditorId };
export { resolveFeedEditor } from '@/lib/feed/editors';

export type DiscoveredItem = {
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet?: string;
  sourceName?: string;
};

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
      { role: 'system', content: BASE_SYSTEM_PROMPT },
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
  contentType: FeedPostType,
  options?: { categorySlug?: string | null; editorId?: FeedEditorId | null }
): Promise<AiEditorDraft> {
  return runFeedEditor({
    contentType,
    categorySlug: options?.categorySlug,
    editorId: options?.editorId,
    preferDeepseek: true,
    temperature: 0.75,
    maxTokens: 2500,
    fallbackTitle: item.sourceTitle,
    fallbackContentType: contentType,
    userPrompt: buildDraftUserPrompt({
      task: 'Bu haberi BiletFeed Feed için orijinal bir makaleye dönüştür.',
      contentType,
      body: `Kaynak: ${item.sourceName ?? ''}
Orijinal başlık: ${item.sourceTitle}
Özet: ${item.sourceSnippet ?? ''}
URL: ${item.sourceUrl}`
    })
  });
}

export async function generateEventRecap(event: {
  title: string;
  venue: string;
  city: string;
  date: string;
  description: string;
}): Promise<AiEditorDraft> {
  return runFeedEditor({
    contentType: 'event_recap',
    preferDeepseek: true,
    temperature: 0.7,
    maxTokens: 2000,
    fallbackTitle: `${event.title} — Ne Oldu?`,
    fallbackContentType: 'event_recap',
    fallbackTags: [event.city.toLowerCase(), 'etkinlik özeti'],
    userPrompt: buildDraftUserPrompt({
      task:
        'Bu etkinlik için "Ne Oldu?" tarzı bir özet makale yaz. Bölümler Türkçe olsun (ör. Öne Çıkanlar, Atmosfer, Performans Özeti, Mekân Deneyimi, Final İzlenimi).',
      contentType: 'event_recap',
      body: `Etkinlik: ${event.title}
Mekân: ${event.venue}, ${event.city}
Tarih: ${event.date}
Açıklama: ${event.description.slice(0, 800)}`
    })
  });
}

/**
 * Editörün admin panelden girdiği ham haber içeriği/notundan sıfırdan tam bir
 * makale taslağı üretir. Kategori / contentType'a göre specialty editör seçilir.
 */
export async function generateArticleFromBrief(
  brief: string,
  options?: {
    contentTypeHint?: FeedPostType;
    categorySlug?: string | null;
    editorId?: FeedEditorId | null;
  }
): Promise<AiEditorDraft> {
  const contentTypeHint = options?.contentTypeHint;
  const editor = resolveFeedEditor({
    contentType: contentTypeHint,
    categorySlug: options?.categorySlug,
    editorId: options?.editorId
  });

  return runFeedEditor({
    contentType: contentTypeHint ?? editor.defaultContentType,
    categorySlug: options?.categorySlug,
    editorId: options?.editorId,
    preferDeepseek: true,
    temperature: 0.75,
    maxTokens: 2500,
    fallbackTitle: 'Yeni Haber',
    fallbackContentType: contentTypeHint ?? editor.defaultContentType,
    userPrompt: buildDraftUserPrompt({
      task: 'Aşağıdaki ham haber notundan/içeriğinden BiletFeed Feed için tam bir makale oluştur.',
      contentType: contentTypeHint,
      includeContentTypeField: !contentTypeHint,
      body: `Ham içerik / editör notu:
${brief}`
    })
  });
}

/**
 * Mevcut haberi kategori specialty editörü + DeepSeek ile tamamen yeniden yazar.
 * Admin "AI ile Yeniden Oluştur" butonu tarafından kullanılır.
 */
export async function regeneratePostAsMagazineEditor(post: {
  title: string;
  headline?: string | null;
  summary: string;
  content: string;
  contentType: FeedPostType;
  tags: string[];
  artistName?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  editorId?: FeedEditorId | null;
}): Promise<AiEditorDraft> {
  return regenerateWithCategoryEditor(post);
}

export const AI_EDITOR_META = {
  name: 'BiletFeed AI Editör',
  author: FEED_AUTHOR_NAME
};
