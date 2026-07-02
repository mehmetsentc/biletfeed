import { PLATFORM_LABELS } from '@/lib/scraper/types';
import type { ExternalPlatform } from '@prisma/client';

const INTERNAL_TAG_PREFIX = 'eksik-';

const INTERNAL_EXACT_TAGS = new Set(['ai-rejected']);

const PLATFORM_LABELS_LOWER = new Set(
  Object.values(PLATFORM_LABELS).map((label) => label.toLowerCase())
);

const PLATFORM_SLUGS_LOWER = new Set(
  (Object.keys(PLATFORM_LABELS) as ExternalPlatform[]).map((key) =>
    key.toLowerCase().replace(/_/g, '-')
  )
);

/** Admin / scraper iç etiketleri — halka açık sayfalarda gösterilmez */
export function isInternalEventTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith(INTERNAL_TAG_PREFIX)) return true;
  if (INTERNAL_EXACT_TAGS.has(normalized)) return true;
  if (PLATFORM_LABELS_LOWER.has(normalized)) return true;
  if (PLATFORM_SLUGS_LOWER.has(normalized)) return true;
  return false;
}

/** Halka açık etkinlik sayfalarında gösterilecek etiketler */
export function filterPublicEventTags(tags: string[]): string[] {
  return tags.filter((tag) => !isInternalEventTag(tag));
}
