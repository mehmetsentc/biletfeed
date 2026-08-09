import { z } from 'zod';
import { zodErrorMessage } from '@/lib/api/zod-validation';
import type { FeedPostType } from '@prisma/client';

const VALID_CONTENT_TYPES: FeedPostType[] = [
  'concert_news',
  'festival_news',
  'music_news',
  'entertainment_news',
  'artist_news',
  'event_announcement',
  'behind_the_scenes',
  'event_recap',
  'top_list',
  'weekend_guide',
  'city_guide',
  'venue_guide',
  'ticket_alert',
  'trending_story',
  'ai_opinion',
  'interview',
  'photo_story',
  'video_story',
  'organizer_update'
];

export function sanitizeContentType(raw: unknown, fallback: FeedPostType = 'entertainment_news'): FeedPostType {
  if (typeof raw === 'string' && VALID_CONTENT_TYPES.includes(raw as FeedPostType)) {
    return raw as FeedPostType;
  }
  return fallback;
}

/** AI JSON çıktısı — zorunlu alanlar Zod ile doğrulanır */
export const feedAiOutputSchema = z.object({
  title: z.string().trim().min(3, 'title en az 3 karakter').max(300),
  slug: z.string().trim().min(3).max(100).optional(),
  headline: z.string().trim().min(3, 'headline en az 3 karakter').max(300),
  summary: z.string().trim().min(10, 'summary en az 10 karakter').max(600),
  content: z.string().trim().min(80, 'content en az 80 karakter olmalı'),
  excerpt: z.string().trim().min(10).max(600).optional(),
  contentType: z.string().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).min(1, 'en az 1 etiket').max(12),
  artistName: z.string().trim().max(120).optional().nullable(),
  seoTitle: z.string().trim().min(3, 'seoTitle gerekli').max(70),
  seoDescription: z
    .string()
    .trim()
    .min(40, 'seoDescription en az 40 karakter')
    .max(200),
  seoKeywords: z.array(z.string().trim().min(1).max(40)).min(3, 'en az 3 seoKeywords').max(12),
  isFeatured: z.boolean().optional(),
  readingTimeMinutes: z.number().int().min(1).max(60).optional()
});

export type FeedAiOutput = z.infer<typeof feedAiOutputSchema>;

export function parseFeedAiOutput(raw: unknown): FeedAiOutput {
  const result = feedAiOutputSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`AI çıktı şeması geçersiz: ${zodErrorMessage(result.error)}`);
  }
  return result.data;
}

/** AI yanıtı bazen kod bloğu veya ek metinle sarmalanmış JSON döndürebilir */
export function extractJsonObject(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI JSON parse hatası — geçerli JSON bulunamadı');
    try {
      return JSON.parse(match[0]) as unknown;
    } catch {
      throw new Error('AI JSON parse hatası — JSON bozuk');
    }
  }
}

export { VALID_CONTENT_TYPES };
