/**
 * Apple App Review için BiletFeed Giriş demo erişimi oluşturur.
 * Mevcut organizatör hesabı altında test etkinliği + davetiye (bilet) + kapı kodu üretir.
 * Gerçek kullanıcı verisine dokunmaz, ayrı ve kolayca silinebilir bir etkinlik oluşturur.
 *
 * npx dotenv -e .env.local -- npx tsx scripts/create-app-review-demo.ts
 */
import { prisma } from '../lib/db/prisma';
import { createOrganizerEvent } from '../lib/services/organizer-events';
import { approveInternalEvent } from '../lib/services/event-approvals';
import { createEventInvitation } from '../lib/services/event-invitations';
import { createScannerGateCode } from '../lib/auth/scanner-gate';

const ORGANIZER_EMAIL = 'mehmetsentc@gmail.com';

async function main() {
  console.log('=== Apple App Review Demo Kurulumu (BiletFeed Giriş) ===\n');

  const owner = await prisma.user.findFirst({
    where: { email: ORGANIZER_EMAIL, deletedAt: null },
    include: { ownedOrganizer: true }
  });
  if (!owner?.ownedOrganizer) {
    console.error('Organizatör bulunamadı:', ORGANIZER_EMAIL);
    process.exit(1);
  }
  const organizer = owner.ownedOrganizer;
  console.log(`Organizatör: ${organizer.name} (${owner.email})`);

  const city = await prisma.city.findFirst({ where: { slug: 'antalya', deletedAt: null } });
  const category = await prisma.category.findFirst({ where: { slug: 'party', deletedAt: null } });
  if (!city || !category) {
    console.error('Şehir/kategori eksik (antalya/party)');
    process.exit(1);
  }

  const start = new Date();
  start.setDate(start.getDate() + 30);
  start.setHours(20, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 0, 0);

  const event = await createOrganizerEvent({
    organizerId: organizer.id,
    title: 'Apple App Review — Demo Etkinlik (silinebilir)',
    description:
      'Bu etkinlik yalnızca Apple App Review sürecinde BiletFeed Giriş uygulamasının kapı tarama akışını test etmek için oluşturulmuştur. Gerçek bir etkinlik değildir.',
    categorySlug: 'party',
    citySlug: 'antalya',
    venueName: 'Demo Mekan',
    startDate: start,
    endDate: end,
    isFree: false,
    price: 100,
    capacity: 50,
    status: 'pending',
    ticketCategories: [
      { name: 'Demo Bilet', description: 'App Review test bileti', price: 100, capacity: 50 }
    ]
  });
  await approveInternalEvent(event.id);
  console.log(`Demo etkinlik oluşturuldu: ${event.title} [${event.id}]`);

  const ticketType = event.ticketTypes[0];
  const invitation = await createEventInvitation({
    organizerId: organizer.id,
    eventId: event.id,
    ticketTypeId: ticketType.id,
    guestName: 'App Review Demo Misafir',
    guestEmail: `applereview+${Date.now()}@biletfeed.local`
  });
  console.log(`Demo bilet kodu: ${invitation.ticketCode}`);

  const gate = await createScannerGateCode({
    organizerId: organizer.id,
    eventId: event.id,
    uid: owner.firebaseUid,
    email: owner.email,
    role: owner.role as any
  });

  console.log('\n=== SONUÇ (App Store Connect Review Bilgileri için) ===');
  console.log(`Kapı kodu (giriş): ${gate.redeemCode}`);
  console.log(`Kod geçerlilik: ${gate.expiresAt.toISOString()} (72 saat)`);
  console.log(`Demo bilet kodu (manuel giriş için): ${invitation.ticketCode}`);
  console.log(`Etkinlik: ${event.title}`);
  console.log(`Giriş URL: https://giris.biletfeed.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
