import type { FeedPostType } from '@prisma/client';
import type { AiProviderId } from '@/lib/ai/types';

/** Site chip / admin kategori specialty editörleri */
export type FeedEditorId =
  | 'concert'
  | 'party'
  | 'festival'
  | 'music'
  | 'trend'
  | 'general';

export type FeedEditorDefinition = {
  id: FeedEditorId;
  label: string;
  /** Varsayılan contentType (AI hint yoksa) */
  defaultContentType: FeedPostType;
  specialtyPrompt: string;
};

export type ResolveFeedEditorInput = {
  contentType?: FeedPostType | null;
  categorySlug?: string | null;
  /** Admin açık seçimi — en yüksek öncelik */
  editorId?: FeedEditorId | null;
};

export type AiEditorDraft = {
  title: string;
  slug: string;
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
  /** AI önerisi — sunucu kapak kapısı olmadan publish/feature yapılmaz */
  isFeatured: boolean;
  meta: {
    editorId: FeedEditorId;
    editorLabel: string;
    provider: AiProviderId | string;
    model: string;
  };
};

export type AiEditorRunMeta = AiEditorDraft['meta'];
