import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { SEED_CATEGORIES } from '../../scripts/seed-event-rules-categories';
import { SEED_RULES } from '../../scripts/seed-event-rules-data';

export type SeedEventRulesResult = {
  categories: number;
  rules: number;
};

/** Etkinlik oluşturma sihirbazı kural kataloğunu upsert eder */
export async function seedEventRulesCatalog(): Promise<SeedEventRulesResult> {
  await ensureDbConnection();

  const categoryIdBySlug = new Map<string, string>();

  for (const cat of SEED_CATEGORIES) {
    const row = await prisma.eventRuleCategory.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        icon: cat.icon,
        titleTr: cat.titleTr,
        titleEn: cat.titleEn,
        descriptionTr: cat.descriptionTr ?? null,
        descriptionEn: cat.descriptionEn ?? null,
        sortOrder: cat.sortOrder,
        status: 'active',
        isSystem: true
      },
      update: {
        icon: cat.icon,
        titleTr: cat.titleTr,
        titleEn: cat.titleEn,
        descriptionTr: cat.descriptionTr ?? null,
        descriptionEn: cat.descriptionEn ?? null,
        sortOrder: cat.sortOrder,
        status: 'active'
      }
    });
    categoryIdBySlug.set(cat.slug, row.id);
  }

  let rules = 0;
  for (const rule of SEED_RULES) {
    const categoryId = categoryIdBySlug.get(rule.categorySlug);
    if (!categoryId) continue;

    await prisma.eventRule.upsert({
      where: { slug: rule.slug },
      create: {
        categoryId,
        slug: rule.slug,
        titleTr: rule.titleTr,
        titleEn: rule.titleEn,
        descriptionTr: rule.descriptionTr,
        descriptionEn: rule.descriptionEn,
        sortOrder: rule.sortOrder ?? 0,
        eventTypes: rule.eventTypes ?? [],
        isDefault: rule.isDefault ?? false,
        isRecommended: rule.isRecommended ?? false,
        requiresParameter: rule.requiresParameter ?? false,
        parameterType: rule.parameterType ?? 'none',
        isSystem: true,
        status: 'active'
      },
      update: {
        categoryId,
        titleTr: rule.titleTr,
        titleEn: rule.titleEn,
        descriptionTr: rule.descriptionTr,
        descriptionEn: rule.descriptionEn,
        sortOrder: rule.sortOrder ?? 0,
        eventTypes: rule.eventTypes ?? [],
        isDefault: rule.isDefault ?? false,
        isRecommended: rule.isRecommended ?? false,
        requiresParameter: rule.requiresParameter ?? false,
        parameterType: rule.parameterType ?? 'none',
        status: 'active'
      }
    });
    rules += 1;
  }

  return { categories: SEED_CATEGORIES.length, rules };
}
