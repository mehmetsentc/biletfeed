#!/usr/bin/env tsx
import { prisma } from '@/lib/db/prisma';
import { seedEventRulesCatalog } from '@/lib/seed/event-rules';

async function main() {
  const result = await seedEventRulesCatalog();
  console.log(
    `Done. Upserted ${result.categories} categories and ${result.rules} rules.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
