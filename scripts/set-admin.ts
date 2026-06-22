#!/usr/bin/env tsx
/**
 * Admin / süperadmin rolü ata.
 * Kullanım:
 *   npx dotenv -e .env.local -- tsx scripts/set-admin.ts [email] [admin|super]
 * Varsayılan: mehmetsentc@gmail.com → ROLE_SUPER_ADMIN
 */
import type { UserRole } from '@/types';
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import { syncFirebaseCustomClaims } from '../lib/services/users';

const email = process.argv[2] || 'mehmetsentc@gmail.com';
const roleMode = (process.argv[3] || 'super').toLowerCase();
const targetRole: UserRole =
  roleMode === 'admin' ? 'ROLE_ADMIN' : 'ROLE_SUPER_ADMIN';

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

  if (target.role === targetRole) {
    console.log(`\n✅ ${email} zaten ${targetRole}\n`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: targetRole }
  });

  await syncFirebaseCustomClaims(target.firebaseUid, targetRole);

  console.log(`\n✅ ${email} → ${targetRole} atandı`);
  console.log('   → Çıkış yapıp tekrar giriş yapın (/admin erişimi için)\n');
}

main()
  .catch((e) => {
    console.error('Hata:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
