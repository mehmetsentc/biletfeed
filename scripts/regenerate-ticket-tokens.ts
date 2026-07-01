/**
 * Etkinlik biletlerinin validation token'larını güncel TICKET_SECRET_KEY ile yeniler.
 *
 * npx dotenv -e .env.local -- npx tsx scripts/regenerate-ticket-tokens.ts [organizerEmail]
 */
import { prisma } from '../lib/db/prisma';
import { generateValidationToken } from '../lib/tickets/sign';

const email = process.argv[2] ?? 'mehmetsentc@gmail.com';

async function main() {
  const owner = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { ownedOrganizer: true }
  });
  if (!owner?.ownedOrganizer) {
    console.error('Organizatör bulunamadı');
    process.exit(1);
  }

  const tickets = await prisma.purchasedTicket.findMany({
    where: {
      deletedAt: null,
      status: 'VALID',
      event: { organizerId: owner.ownedOrganizer.id, deletedAt: null }
    },
    select: { id: true, eventId: true, ticketCode: true, tokenNonce: true }
  });

  let updated = 0;
  for (const ticket of tickets) {
    const validationToken = generateValidationToken(
      ticket.id,
      ticket.eventId,
      ticket.tokenNonce
    );
    await prisma.purchasedTicket.update({
      where: { id: ticket.id },
      data: { validationToken }
    });
    updated++;
    console.log('Yenilendi:', ticket.ticketCode);
  }

  console.log(`\n${updated} bilet token'ı güncellendi (${owner.ownedOrganizer.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
