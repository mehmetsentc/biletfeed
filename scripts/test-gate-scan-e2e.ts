/**
 * Tam kapı taraması E2E — yeni etkinlik + davetiye oluşturur, QR giriş simüle eder.
 *
 * npx dotenv -e .env.local -- npx tsx scripts/test-gate-scan-e2e.ts
 */
import { prisma } from '../lib/db/prisma';
import { resolveScannerUser } from '../lib/auth/organizer-api';
import { validateTicketInput } from '../lib/services/ticket-validation';
import { buildTicketQrPayload, verifyValidationToken } from '../lib/tickets/sign';
import { createOrganizerEvent } from '../lib/services/organizer-events';
import { approveInternalEvent } from '../lib/services/event-approvals';
import { createEventInvitation } from '../lib/services/event-invitations';

const ORGANIZER_EMAIL = 'mehmetsentc@gmail.com';
const STAMP = new Date().toISOString().slice(0, 16).replace('T', ' ');

function log(step: string, ok: boolean, detail?: string) {
  console.log(`${ok ? '✓' : '✗'} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('=== BiletFeed Kapı Tarama E2E Test ===\n');

  const owner = await prisma.user.findFirst({
    where: { email: ORGANIZER_EMAIL, deletedAt: null },
    include: { ownedOrganizer: true }
  });
  if (!owner?.ownedOrganizer) {
    console.error('Organizatör bulunamadı');
    process.exit(1);
  }
  const organizer = owner.ownedOrganizer;
  log('Organizatör yüklendi', true, `${organizer.name} (${owner.email})`);

  const city = await prisma.city.findFirst({
    where: { slug: 'antalya', deletedAt: null }
  });
  const category = await prisma.category.findFirst({
    where: { slug: 'party', deletedAt: null }
  });
  if (!city || !category) {
    console.error('Şehir/kategori eksik');
    process.exit(1);
  }

  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(20, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 0, 0);

  const event = await createOrganizerEvent({
    organizerId: organizer.id,
    title: `QR Giriş Test ${STAMP}`,
    description:
      'Otomatik kapı tarama test etkinliği. Bu etkinlik sistem doğrulaması için oluşturulmuştur.',
    categorySlug: 'party',
    citySlug: 'antalya',
    venueName: 'Test Mekan',
    startDate: start,
    endDate: end,
    isFree: false,
    price: 100,
    capacity: 50,
    status: 'pending',
    ticketCategories: [
      { name: 'Genel Giriş', description: 'Test bileti', price: 100, capacity: 50 }
    ]
  });
  await approveInternalEvent(event.id);
  log('Test etkinliği oluşturuldu', true, `${event.title} [${event.id.slice(0, 8)}]`);

  const ticketType = event.ticketTypes[0];
  const invitation = await createEventInvitation({
    organizerId: organizer.id,
    eventId: event.id,
    ticketTypeId: ticketType.id,
    guestName: 'Test Misafir',
    guestEmail: `qr-test+${Date.now()}@biletfeed.local`
  });
  log('Davetiye oluşturuldu', true, `Kod: ${invitation.ticketCode}`);

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { ticketCode: invitation.ticketCode, deletedAt: null },
    include: {
      invitation: { select: { organizerId: true, inviteToken: true } },
      order: { select: { organizerId: true } }
    }
  });
  if (!ticket) {
    log('Bilet kaydı', false);
    process.exit(1);
  }

  const tokenOk = verifyValidationToken(
    ticket.id,
    event.id,
    ticket.validationToken,
    ticket.tokenNonce
  );
  log('QR token imzası (yeni bilet)', tokenOk, ticket.validationToken.slice(0, 16) + '...');

  const scannerUser = await resolveScannerUser(owner.firebaseUid, owner.email ?? undefined);
  log('resolveScannerUser', scannerUser?.id === owner.id, `userId=${scannerUser?.id.slice(0, 8)}`);

  const qrUrl = buildTicketQrPayload({
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode,
    validationToken: ticket.validationToken
  });
  console.log('\nQR URL:', qrUrl);
  console.log('Davetiye URL:', invitation.inviteUrl);
  console.log('Manuel kod:', invitation.ticketCode, '\n');

  const scannerCtx = {
    scannerUid: owner.firebaseUid,
    scannerEmail: owner.email ?? undefined,
    scannerRole: owner.role as 'ROLE_SUPER_ADMIN',
    scannerUserId: scannerUser!.id,
    scannerOrganizerId: organizer.id
  };

  // 1) QR tarama — giriş onayı (markUsed)
  const scan1 = await validateTicketInput({
    qrRaw: qrUrl,
    ...scannerCtx,
    markUsed: true,
    eventId: event.id
  });
  log('QR tarama (1. giriş)', scan1.status === 'VALID', scan1.message);

  // 2) Aynı QR tekrar — kullanılmış olmalı
  const scan2 = await validateTicketInput({
    qrRaw: qrUrl,
    ...scannerCtx,
    markUsed: true,
    eventId: event.id
  });
  log('QR tarama (2. giriş)', scan2.status === 'USED', scan2.message);

  // 3) Manuel kod
  const freshInvite = await createEventInvitation({
    organizerId: organizer.id,
    eventId: event.id,
    ticketTypeId: ticketType.id,
    guestName: 'Manuel Test',
    guestEmail: `manuel+${Date.now()}@biletfeed.local`
  });
  const manualScan = await validateTicketInput({
    ticketCode: freshInvite.ticketCode,
    ...scannerCtx,
    markUsed: true
  });
  log('Manuel kod tarama', manualScan.status === 'VALID', manualScan.message);

  // 4) Davetiye URL ile QR parse
  const davetiyeUrl = invitation.inviteUrl;
  const scanInviteUrl = await validateTicketInput({
    qrRaw: davetiyeUrl,
    ...scannerCtx,
    markUsed: false
  });
  log('Davetiye URL parse', scanInviteUrl.status === 'VALID' || scanInviteUrl.status === 'USED', scanInviteUrl.message);

  // 5) Yanlış organizatör simülasyonu
  const other = await prisma.user.findFirst({
    where: { email: 'aercan19@icloud.com', deletedAt: null },
    include: { ownedOrganizer: true }
  });
  if (other?.ownedOrganizer) {
    const wrongScan = await validateTicketInput({
      qrRaw: buildTicketQrPayload({
        ticketId: ticket.id,
        ticketCode: freshInvite.ticketCode,
        validationToken: (
          await prisma.purchasedTicket.findFirstOrThrow({
            where: { ticketCode: freshInvite.ticketCode }
          })
        ).validationToken
      }),
      scannerUid: other.firebaseUid,
      scannerEmail: other.email ?? undefined,
      scannerRole: other.role as 'ROLE_ORGANIZER',
      scannerUserId: other.id,
      scannerOrganizerId: other.ownedOrganizer.id,
      markUsed: false
    });
    log(
      'Yanlış organizatör engeli',
      wrongScan.status === 'INVALID' && wrongScan.message.includes('etkinliğine ait'),
      wrongScan.message.slice(0, 80)
    );
  }

  const allOk =
    tokenOk &&
    scan1.status === 'VALID' &&
    scan2.status === 'USED' &&
    manualScan.status === 'VALID';

  console.log('\n=== ÖZET ===');
  if (allOk) {
    console.log('Tüm testler başarılı. Canlıda şu bileti tarayın:');
    console.log(`  Kod: ${freshInvite.ticketCode}`);
    console.log(`  Etkinlik: ${event.title}`);
    console.log(`  Panel: https://giris.biletfeed.com/tarayici`);
    console.log(`  Filtre: "${event.title}" veya "Tüm etkinlikler"`);
  } else {
    console.log('BAŞARISIZ — yukarıdaki ✗ satırlarına bakın');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
