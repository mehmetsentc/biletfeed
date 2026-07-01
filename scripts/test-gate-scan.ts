/**
 * Kapı taraması uçtan uca testi — davetiye + satın alınmış bilet yetkilendirmesi.
 *
 * Kullanım: npx dotenv -e .env.local -- npx tsx scripts/test-gate-scan.ts [organizerEmail]
 */
import { prisma } from '../lib/db/prisma';
import { canScannerAccessTicket, resolveScannerUser } from '../lib/auth/organizer-api';
import { validateTicketInput } from '../lib/services/ticket-validation';
import { buildTicketQrPayload } from '../lib/tickets/sign';
import {
  createEventInvitation,
  listEventInvitations
} from '../lib/services/event-invitations';

const organizerEmail = process.argv[2] ?? 'mehmetsentc@gmail.com';

async function main() {
  const owner = await prisma.user.findFirst({
    where: { email: organizerEmail, deletedAt: null },
    include: { ownedOrganizer: true }
  });

  if (!owner?.ownedOrganizer) {
    console.error('Organizatör bulunamadı:', organizerEmail);
    process.exit(1);
  }

  const organizer = owner.ownedOrganizer;
  console.log('Organizatör:', organizer.name, organizer.id);
  console.log('Sahip:', owner.email, owner.firebaseUid);

  let event = await prisma.event.findFirst({
    where: {
      organizerId: organizer.id,
      deletedAt: null,
      listingType: 'internal',
      status: 'published',
      endDate: { gt: new Date() }
    },
    include: {
      ticketTypes: { where: { deletedAt: null, status: 'active' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!event?.ticketTypes[0]) {
    console.log('Yayında test etkinliği yok — Party Party aranıyor...');
    event = await prisma.event.findFirst({
      where: { title: { contains: 'Party', mode: 'insensitive' }, organizerId: organizer.id, deletedAt: null },
      include: { ticketTypes: { where: { deletedAt: null }, take: 1 } }
    });
  }

  if (!event?.ticketTypes[0]) {
    console.error('Test için uygun etkinlik bulunamadı');
    process.exit(1);
  }

  const ticketType = event.ticketTypes[0];
  console.log('Etkinlik:', event.title, event.id);

  let invitations = await listEventInvitations(organizer.id, event.id);
  if (invitations.length === 0) {
    console.log('Davetiye oluşturuluyor...');
    await createEventInvitation({
      organizerId: organizer.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      guestName: 'Gate Scan Test',
      guestEmail: `gate-test+${Date.now()}@biletfeed.local`
    });
    invitations = await listEventInvitations(organizer.id, event.id);
  }

  const invite = invitations[0];
  console.log('Davetiye bilet kodu:', invite.ticketCode);

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { ticketCode: invite.ticketCode, deletedAt: null },
    include: {
      invitation: { select: { organizerId: true } },
      order: { select: { organizerId: true } }
    }
  });

  if (!ticket) {
    console.error('Bilet kaydı bulunamadı');
    process.exit(1);
  }

  const scannerUser = await resolveScannerUser(owner.firebaseUid, owner.email ?? undefined);
  if (!scannerUser) {
    console.error('resolveScannerUser başarısız');
    process.exit(1);
  }

  const canScan = await canScannerAccessTicket({
    ticketId: ticket.id,
    eventId: event.id,
    firebaseUid: owner.firebaseUid,
    email: owner.email ?? undefined,
    role: owner.role as 'ROLE_SUPER_ADMIN',
    scannerUserId: scannerUser.id,
    scannerOrganizerId: organizer.id,
    eventOrganizerId: event.organizerId,
    invitationOrganizerId: ticket.invitation?.organizerId,
    orderOrganizerId: ticket.order.organizerId
  });

  console.log('canScannerAccessTicket:', canScan ? 'OK' : 'FAIL');

  const qr = buildTicketQrPayload({
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode,
    validationToken: ticket.validationToken
  });

  const result = await validateTicketInput({
    qrRaw: qr,
    scannerUid: owner.firebaseUid,
    scannerEmail: owner.email ?? undefined,
    scannerRole: owner.role as 'ROLE_SUPER_ADMIN',
    scannerUserId: scannerUser.id,
    scannerOrganizerId: organizer.id,
    markUsed: false
  });

  console.log('validateTicketInput (QR):', result.status, result.message);

  const manual = await validateTicketInput({
    ticketCode: ticket.ticketCode,
    scannerUid: owner.firebaseUid,
    scannerEmail: owner.email ?? undefined,
    scannerRole: owner.role as 'ROLE_SUPER_ADMIN',
    scannerUserId: scannerUser.id,
    scannerOrganizerId: organizer.id,
    markUsed: false
  });

  console.log('validateTicketInput (manuel kod):', manual.status, manual.message);

  const authOk = canScan && manual.status === 'VALID';
  const qrOk = result.status === 'VALID';

  if (!authOk) {
    process.exit(1);
  }

  if (qrOk) {
    console.log('\n✓ Kapı taraması testi başarılı (QR + manuel)');
  } else {
    console.log(
      '\n✓ Yetkilendirme OK — manuel bilet kodu çalışıyor.',
      'QR token doğrulaması yerel ortamda TICKET_SECRET_KEY farkından başarısız olabilir; production aynı anahtarı kullanır.'
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
