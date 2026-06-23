#!/usr/bin/env tsx
/** Eksik orders ödeme sütunlarını production DB'ye ekler */
import { prisma, ensureDbConnection } from '../lib/db/prisma';

async function main() {
  await ensureDbConnection();
  const statements = [
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_session_id" TEXT`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3)`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3)`
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('✅ orders payment columns applied');
}

main()
  .catch((e) => {
    console.error('Hata:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
