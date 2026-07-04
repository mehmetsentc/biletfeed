import {
  getCachedCatalog,
  setCachedCatalog
} from '@/lib/event-rules/cache';
import type {
  RuleCatalogCategory,
  RuleCatalogRule
} from '@/lib/event-rules/types';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { isMissingRulesTableError } from '@/lib/services/event-rules-query';

/** Kural kataloğu — public sayfalar için sanitize/AI bağımlılığı yok */
export async function loadEventRulesCatalog(): Promise<{
  categories: RuleCatalogCategory[];
  rules: RuleCatalogRule[];
}> {
  const cached = getCachedCatalog();
  if (cached) {
    return { categories: cached.categories, rules: cached.rules };
  }

  await ensureDbConnection();

  try {
    const [categoriesRaw, rulesRaw] = await Promise.all([
      prisma.eventRuleCategory.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.eventRule.findMany({
        where: { status: 'active' },
        include: { category: { select: { slug: true } } },
        orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }]
      })
    ]);

    const ruleCounts = new Map<string, number>();
    for (const rule of rulesRaw) {
      ruleCounts.set(rule.categoryId, (ruleCounts.get(rule.categoryId) ?? 0) + 1);
    }

    const categories: RuleCatalogCategory[] = categoriesRaw.map((c) => ({
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      titleTr: c.titleTr,
      titleEn: c.titleEn,
      descriptionTr: c.descriptionTr,
      descriptionEn: c.descriptionEn,
      sortOrder: c.sortOrder,
      ruleCount: ruleCounts.get(c.id) ?? 0
    }));

    const rules: RuleCatalogRule[] = rulesRaw.map((r) => ({
      id: r.id,
      slug: r.slug,
      categoryId: r.categoryId,
      categorySlug: r.category.slug,
      subcategory: r.subcategory,
      titleTr: r.titleTr,
      titleEn: r.titleEn,
      descriptionTr: r.descriptionTr,
      descriptionEn: r.descriptionEn,
      icon: r.icon,
      sortOrder: r.sortOrder,
      eventTypes: r.eventTypes,
      isDefault: r.isDefault,
      isRecommended: r.isRecommended,
      requiresParameter: r.requiresParameter,
      parameterType: r.parameterType,
      parameterOptions: r.parameterOptions
    }));

    setCachedCatalog(categories, rules);
    return { categories, rules };
  } catch (err) {
    if (isMissingRulesTableError(err)) {
      return { categories: [], rules: [] };
    }
    throw err;
  }
}
