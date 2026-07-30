/**
 * Geçici tanı scripti — kapı kodunun geçerlilik süresini kontrol eder.
 * npx dotenv -e .env.local -- npx tsx scripts/_check-gate-code.ts
 */
import { prisma } from '../lib/db/prisma';

async function main() {
  console.log('=== Kapı kodu kontrolü ===');
  const row = await prisma.scannerGateCode.findUnique({
    where: { code: 'DG8KGSE4WM' }
  });
  console.log('Kayıt:', JSON.stringify(row, null, 2));
  console.log('Şu an:', new Date().toISOString());
  if (row) {
    console.log('Geçerli mi:', row.expiresAt.getTime() > Date.now());
  } else {
    console.log('Kod bulunamadı (silinmiş / hiç oluşturulmamış olabilir).');
  }
}

main()
  .catch((e) => {
    console.error('HATA:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
