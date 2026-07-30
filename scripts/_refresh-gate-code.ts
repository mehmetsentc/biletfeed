/**
 * Geçici script — mevcut Apple Review demo etkinliği için süresi dolmuş kapı
 * kodu yerine yeni bir kod üretir. Yeni etkinlik/bilet oluşturmaz (mevcut
 * demo etkinliği yeniden kullanır), bu yüzden create-app-review-demo.ts'e
 * göre çok daha az modül import eder ve hızlı çalışır.
 *
 * npx dotenv -e .env.local -- npx tsx scripts/_refresh-gate-code.ts
 */
import { prisma } from '../lib/db/prisma';
import { createScannerGateCode } from '../lib/auth/scanner-gate';

const EVENT_ID = '9fdc1a43-2247-4d96-b588-b92ceb7243d2';
const ORGANIZER_ID = '79e5eb17-c59a-4a48-940b-c6b729fcc59a';
const UID = 'pvZTn0EOt3TqyioOiK5o5WGuz4l2';
const EMAIL = 'mehmetsentc@gmail.com';
const ROLE = 'ROLE_SUPER_ADMIN' as const;

async function main() {
  console.log('=== Kapı kodu yenileme ===');

  const event = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: { id: true, title: true, deletedAt: true, status: true }
  });
  console.log('Etkinlik:', JSON.stringify(event, null, 2));

  if (!event || event.deletedAt) {
    console.error('Demo etkinlik bulunamadı veya silinmiş. create-app-review-demo.ts ile yeniden oluşturulması gerekir.');
    process.exit(1);
  }

  const gate = await createScannerGateCode({
    organizerId: ORGANIZER_ID,
    eventId: EVENT_ID,
    uid: UID,
    email: EMAIL,
    role: ROLE
  });

  console.log('\n=== SONUÇ ===');
  console.log('Yeni kapı kodu:', gate.redeemCode);
  console.log('Geçerlilik:', gate.expiresAt.toISOString(), '(72 saat)');
}

main()
  .catch((e) => {
    console.error('HATA:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
