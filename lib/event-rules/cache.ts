import type { RuleCatalogCategory, RuleCatalogRule } from '@/lib/event-rules/types';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CatalogCache {
  categories: RuleCatalogCategory[];
  rules: RuleCatalogRule[];
  expiresAt: number;
}

let catalogCache: CatalogCache | null = null;

export function getCachedCatalog(): CatalogCache | null {
  if (!catalogCache) return null;
  if (Date.now() > catalogCache.expiresAt) {
    catalogCache = null;
    return null;
  }
  return catalogCache;
}

export function setCachedCatalog(
  categories: RuleCatalogCategory[],
  rules: RuleCatalogRule[]
): void {
  catalogCache = {
    categories,
    rules,
    expiresAt: Date.now() + CACHE_TTL_MS
  };
}

export function invalidateCatalogCache(): void {
  catalogCache = null;
}

export function buildRulesByCategoryMap(
  rules: RuleCatalogRule[]
): Map<string, RuleCatalogRule[]> {
  const map = new Map<string, RuleCatalogRule[]>();
  for (const rule of rules) {
    const list = map.get(rule.categoryId) ?? [];
    list.push(rule);
    map.set(rule.categoryId, list);
  }
  return map;
}

export function buildRulesByIdMap(
  rules: RuleCatalogRule[]
): Map<string, RuleCatalogRule> {
  return new Map(rules.map((r) => [r.id, r]));
}

export function buildRulesBySlugMap(
  rules: RuleCatalogRule[]
): Map<string, RuleCatalogRule> {
  return new Map(rules.map((r) => [r.slug, r]));
}
