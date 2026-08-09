import type { FeedPostType } from '@prisma/client';
import { CONCERT_EDITOR } from '@/lib/feed/editors/concert';
import { PARTY_EDITOR } from '@/lib/feed/editors/party';
import { FESTIVAL_EDITOR } from '@/lib/feed/editors/festival';
import { MUSIC_EDITOR } from '@/lib/feed/editors/music';
import { TREND_EDITOR } from '@/lib/feed/editors/trend';
import { GENERAL_EDITOR } from '@/lib/feed/editors/base';
import type {
  FeedEditorDefinition,
  FeedEditorId,
  ResolveFeedEditorInput
} from '@/lib/feed/editors/types';

const EDITORS: Record<FeedEditorId, FeedEditorDefinition> = {
  concert: CONCERT_EDITOR,
  party: PARTY_EDITOR,
  festival: FESTIVAL_EDITOR,
  music: MUSIC_EDITOR,
  trend: TREND_EDITOR,
  general: GENERAL_EDITOR
};

const CATEGORY_TO_EDITOR: Record<string, FeedEditorId> = {
  'konser-haberleri': 'concert',
  'festival-haberleri': 'festival',
  'muzik-haberleri': 'music',
  'eglence-haberleri': 'party',
  'trend-hikayeler': 'trend'
};

const CONTENT_TYPE_TO_EDITOR: Partial<Record<FeedPostType, FeedEditorId>> = {
  concert_news: 'concert',
  festival_news: 'festival',
  music_news: 'music',
  artist_news: 'music',
  entertainment_news: 'party',
  trending_story: 'trend'
};

export function getFeedEditorById(id: FeedEditorId): FeedEditorDefinition {
  return EDITORS[id] ?? GENERAL_EDITOR;
}

export function listFeedEditors(): FeedEditorDefinition[] {
  return [CONCERT_EDITOR, PARTY_EDITOR, FESTIVAL_EDITOR, MUSIC_EDITOR, TREND_EDITOR, GENERAL_EDITOR];
}

/**
 * Öncelik: açık editorId → kategori slug → contentType → general.
 * Admin'de "İçerik türü: Konser Haberi" veya kategori "Konser Haberleri" → Konser Editörü.
 * "Eğlence Haberi" / Party chip → Party Editörü.
 */
export function resolveFeedEditor(input: ResolveFeedEditorInput): FeedEditorDefinition {
  if (input.editorId && EDITORS[input.editorId]) {
    return EDITORS[input.editorId];
  }

  const categorySlug = input.categorySlug?.trim().toLowerCase() ?? '';
  if (categorySlug && CATEGORY_TO_EDITOR[categorySlug]) {
    return EDITORS[CATEGORY_TO_EDITOR[categorySlug]];
  }

  if (input.contentType && CONTENT_TYPE_TO_EDITOR[input.contentType]) {
    return EDITORS[CONTENT_TYPE_TO_EDITOR[input.contentType]!];
  }

  return GENERAL_EDITOR;
}

export function editorIdFromContentType(contentType: FeedPostType): FeedEditorId {
  return CONTENT_TYPE_TO_EDITOR[contentType] ?? 'general';
}
