import { aiChat } from '@/lib/ai/client';
import {
  AI_OUTPUT_JSON_SHAPE,
  buildSystemPrompt,
  parseAndFinalizeDraft
} from '@/lib/feed/editors/base';
import { resolveFeedEditor } from '@/lib/feed/editors/router';
import type { AiEditorDraft, FeedEditorId, ResolveFeedEditorInput } from '@/lib/feed/editors/types';
import type { FeedPostType } from '@prisma/client';

const MAGAZINE_REWRITE_EXTRA = `EK ROL — Dergi Editörü (yeniden yazım):
Görevin mevcut haberi SIFIRDAN yeniden kurgulamak. Düzeltme değil, tam yeniden yazım.
Her H2 bölümünde en az 2 paragraf olsun.
Rakamlar, tarihler, mekân ve sanatçı isimleri gibi somut bilgileri koru.`;

export type RunFeedEditorOptions = ResolveFeedEditorInput & {
  userPrompt: string;
  fallbackTitle: string;
  fallbackContentType: FeedPostType;
  fallbackTags?: string[];
  /** Magazine regenerate gibi DeepSeek öncelikli akış */
  preferDeepseek?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemExtra?: string;
};

export async function runFeedEditor(options: RunFeedEditorOptions): Promise<AiEditorDraft> {
  const editor = resolveFeedEditor({
    contentType: options.contentType,
    categorySlug: options.categorySlug,
    editorId: options.editorId
  });

  const contentTypeHint = options.contentType ?? editor.defaultContentType;
  const system = buildSystemPrompt(editor, options.systemExtra);

  const chat = await aiChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: options.userPrompt }
    ],
    {
      ...(options.preferDeepseek ? { provider: 'deepseek' as const } : {}),
      temperature: options.temperature ?? 0.75,
      maxTokens: options.maxTokens ?? 2500,
      jsonMode: true,
      allowFallback: true
    }
  );

  return parseAndFinalizeDraft(chat.content, {
    title: options.fallbackTitle,
    contentType: contentTypeHint,
    tags: options.fallbackTags,
    editor,
    chat
  });
}

export function buildDraftUserPrompt(params: {
  task: string;
  contentType?: FeedPostType | null;
  includeContentTypeField?: boolean;
  body: string;
}): string {
  const typeLine = params.contentType
    ? `contentType: ${params.contentType}`
    : params.includeContentTypeField
      ? 'İçeriğe en uygun contentType değerini sen seç (concert_news, festival_news, music_news, entertainment_news, artist_news, event_announcement, behind_the_scenes, event_recap, top_list, weekend_guide, city_guide, venue_guide, ticket_alert, trending_story, ai_opinion, interview, photo_story, video_story, organizer_update arasından).'
      : '';

  const shape = params.includeContentTypeField || !params.contentType
    ? AI_OUTPUT_JSON_SHAPE.replace(
        '"artistName"',
        '"contentType": "yukarıdaki listeden en uygun değer",\n  "artistName"'
      )
    : AI_OUTPUT_JSON_SHAPE;

  return `${params.task}
${typeLine}

JSON formatı:
${shape}

${params.body}`;
}

export async function regenerateWithCategoryEditor(post: {
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
  const draft = await runFeedEditor({
    contentType: post.contentType,
    categorySlug: post.categorySlug,
    editorId: post.editorId,
    preferDeepseek: true,
    temperature: 0.8,
    maxTokens: 3000,
    systemExtra: MAGAZINE_REWRITE_EXTRA,
    fallbackTitle: post.title,
    fallbackContentType: post.contentType,
    fallbackTags: post.tags,
    userPrompt: buildDraftUserPrompt({
      task: `Aşağıdaki mevcut haberi kategori editörü kalitesinde tamamen yeniden oluştur.${
        post.categoryName ? ` Kategori: ${post.categoryName}.` : ''
      }`,
      contentType: post.contentType,
      includeContentTypeField: true,
      body: `MEVCUT BAŞLIK: ${post.title}
MEVCUT MANŞET: ${post.headline ?? ''}
MEVCUT ÖZET: ${post.summary}
MEVCUT ETİKETLER: ${post.tags.join(', ')}
${post.artistName ? `SANATÇI: ${post.artistName}` : ''}

MEVCUT İÇERİK:
${post.content.slice(0, 6000)}`
    })
  });

  // İçerik boş gelirse mevcut gövdeyi koru (nadir AI hatası)
  if (!draft.content.trim()) {
    return { ...draft, content: post.content };
  }
  return draft;
}
