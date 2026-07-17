/**
 * Bir etkinlik için kapı ekibi kısa kodu üretir (10 haneli, paylaşılabilir).
 *
 * Kullanım:
 *   npx dotenv -e .env.local -- npx tsx scripts/create-gate-code.ts <eventId|başlık parçası> [organizerEmail]
 *
 * Not: Kısa kodun tek başına çalışması için Upstash Redis ortam değişkenleri gereklidir
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Yoksa yalnızca uzun kod çalışır.
 */
import { prisma } from '../lib/db/prisma';
import { createScannerGateCode } from '../lib/auth/scanner-gate';
import { getGirisUrl } from '../lib/config/domain';

const query = process.argv[2];
const organizerEmail = process.argv[3] ?? 'mehmetsentc@gmail.com';

async function main() {
  if (!query) {
    console.error(
      'Kullanım: tsx scripts/create-gate-code.ts <eventId|başlık parçası> [organizerEmail]'
    );
    process.exit(1);
  }

  const owner = await prisma.user.findFirst({
    where: { email: organizerEmail, deletedAt: null },
    include: { ownedOrganizer: true }
  });

  if (!owner?.ownedOrganizer) {
    console.error('Organizatör bulunamadı:', organizerEmail);
    process.exit(1);
  }
  const organizer = owner.ownedOrganizer;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    query
  );

  const event = await prisma.event.findFirst({
    where: {
      organizerId: organizer.id,
      deletedAt: null,
      status: { in: ['published', 'completed'] },
      ...(isUuid
        ? { id: query }
        : { title: { contains: query, mode: 'insensitive' } })
    },
    select: { id: true, title: true },
    orderBy: { startDate: 'desc' }
  });

  if (!event) {
    console.error('Etkinlik bulunamadı veya kapı kodu için uygun değil:', query);
    process.exit(1);
  }

  const created = await createScannerGateCode({
    organizerId: organizer.id,
    eventId: event.id,
    uid: owner.firebaseUid,
    email: owner.email ?? organizerEmail,
    role: owner.role as 'ROLE_SUPER_ADMIN'
  });

  const link = `${getGirisUrl('/')}?gate=${created.pin}`;

  console.log('\n=== Kapı Kodu Oluşturuldu ===');
  console.log('Etkinlik   :', event.title);
  console.log('Kısa kod   :', created.pin);
  console.log('Giriş linki:', link);
  console.log('Geçerlilik :', created.expiresAt.toISOString(), '(72 saat)');
  console.log(
    '\nGörevli giris.biletfeed.com adresine bu 10 haneli kodu girer ya da linki açar.\n'
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
