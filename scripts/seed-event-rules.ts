import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { SEED_CATEGORIES } from './seed-event-rules-categories';
import { SEED_RULES } from './seed-event-rules-data';

async function main() {
  await ensureDbConnection();

  console.log(`Seeding ${SEED_CATEGORIES.length} categories and ${SEED_RULES.length} rules…`);

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

  let created = 0;
  for (const rule of SEED_RULES) {
    const categoryId = categoryIdBySlug.get(rule.categorySlug);
    if (!categoryId) {
      console.warn(`Skip rule ${rule.slug}: unknown category ${rule.categorySlug}`);
      continue;
    }

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
    created += 1;
  }

  console.log(`Done. Upserted ${created} rules.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
