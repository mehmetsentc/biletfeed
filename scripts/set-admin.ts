#!/usr/bin/env tsx
/**
 * Admin rolü ata ve kullanıcı listesini özetle.
 * Kullanım: npx dotenv -e .env.local -- tsx scripts/set-admin.ts [email]
 */
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import {
  syncFirebaseCustomClaims
} from '../lib/services/users';

const email = process.argv[2] || 'mehmetsentc@gmail.com';

async function main() {
  await ensureDbConnection();

  const users = await prisma.user.findMany({
    select: { email: true, role: true, displayName: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`\n📋 Son kullanıcılar (${users.length}):`);
  for (const u of users) {
    console.log(`  • ${u.email} — ${u.role}`);
  }

  const target = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true, firebaseUid: true }
  });

  if (!target) {
    console.log(`\n⚠️  "${email}" henüz DB'de yok.`);
    console.log('   → Önce http://localhost:3000/giris ile giriş yapın (Google veya e-posta).');
    console.log('   → Giriş sonrası bu scripti tekrar çalıştırın.\n');
    process.exit(0);
  }

  if (target.role === 'ROLE_ADMIN' || target.role === 'ROLE_SUPER_ADMIN') {
    console.log(`\n✅ ${email} zaten admin (${target.role})\n`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'ROLE_ADMIN' }
  });

  await syncFirebaseCustomClaims(target.firebaseUid, 'ROLE_ADMIN');

  console.log(`\n✅ ${email} → ROLE_ADMIN atandı`);
  console.log('   → Çıkış yapıp tekrar giriş yapın (/admin erişimi için)\n');
}

main()
  .catch((e) => {
    console.error('Hata:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
