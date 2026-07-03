import {
  CATEGORY_TO_EVENT_TYPE
} from '@/lib/event-rules/constants';
import { getEtiquetteSlugsForCategory } from '@/lib/event-rules/etiquette';
import { getTipSlugsForEventType } from '@/lib/event-rules/tips';
import type {
  RuleCatalogRule,
  RuleSuggestionContext
} from '@/lib/event-rules/types';

export function suggestRuleSlugsHeuristic(
  context: RuleSuggestionContext,
  rulesBySlug: Map<string, RuleCatalogRule>
): string[] {
  const eventType =
    context.eventType ??
    (context.categorySlug
      ? CATEGORY_TO_EVENT_TYPE[context.categorySlug] ?? 'other'
      : 'other');

  const slugs = new Set<string>();

  for (const rule of rulesBySlug.values()) {
    if (!rule.isRecommended && !rule.isDefault) continue;
    if (rule.eventTypes.length === 0 || rule.eventTypes.includes(eventType)) {
      slugs.add(rule.slug);
    }
  }

  for (const slug of getEtiquetteSlugsForCategory(context.categorySlug)) {
    slugs.add(slug);
  }

  for (const slug of getTipSlugsForEventType(eventType)) {
    slugs.add(slug);
  }

  if (context.isOnline) {
    slugs.add('giris-online-baglanti');
    slugs.add('giris-online-kamera');
  }

  if (context.isFree) {
    slugs.add('bilet-ucretsiz-kayit');
  }

  if (context.tags?.includes('Çocuk') || eventType === 'child') {
    slugs.add('yas-cocuk-etkinligi');
    slugs.add('cocuk-yaninda-yetiskin');
  }

  if (context.categorySlug === 'festival') {
    slugs.add('festival-cok-gunlu');
    slugs.add('hava-acik-alan');
  }

  if (context.categorySlug === 'spor') {
    slugs.add('spor-taraftar-kurallari');
    slugs.add('guvenlik-kapi-araci');
  }

  const result: string[] = [];
  for (const slug of slugs) {
    const rule = rulesBySlug.get(slug);
    if (!rule) continue;
    result.push(slug);
  }

  return result.slice(0, 40);
}

export function slugsToRuleIds(
  slugs: string[],
  rulesBySlug: Map<string, RuleCatalogRule>
): string[] {
  return slugs
    .map((slug) => rulesBySlug.get(slug)?.id)
    .filter((id): id is string => Boolean(id));
}
