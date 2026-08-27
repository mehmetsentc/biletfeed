#!/usr/bin/env tsx
/**
 * lib/tickets/antalya-inventory.ts içindeki tahsis tanımları (GIPSY_KINGS_ALLOCATION /
 * GIPSY_KINGS_INVITE_ALLOCATION) değiştiğinde, gerçek Venue.seatPlan snapshot'ı ve
 * "Organizator Davetiye" TicketType kapasitesi kodla senkron KALMAZ — bu script
 * ikisini de yeniden üretip DB'ye yazar.
 *
 * Kullanım: npm run seatplan:sync-antalya
 */
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import {
  buildAntyaSeatPlan,
  INVITE_STOCK,
  ORGANIZER_INVITE_TICKET_NAME
} from '../lib/tickets/antalya-inventory';

const EVENT_SLUG = 'gipsy-kings-by-andre-reyes';

async function main() {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { slug: EVENT_SLUG, deletedAt: null },
    select: {
      id: true,
      venueId: true,
      startDate: true,
      venue: { select: { id: true, seatPlan: true } }
    }
  });
  if (!event?.venueId) throw new Error(`Etkinlik bulunamadı: ${EVENT_SLUG}`);

  const prevPlan = event.venue?.seatPlan;
  let mapUrl: string | undefined;
  if (prevPlan && typeof prevPlan === 'object' && !Array.isArray(prevPlan)) {
    const maybe = (prevPlan as Record<string, unknown>).mapImageUrl;
    if (typeof maybe === 'string') mapUrl = maybe;
  }

  const seatPlan = buildAntyaSeatPlan(mapUrl);
  console.log(
    'Yeni seatPlan zone\'ları:',
    (seatPlan.zones ?? []).map((z) => `${z.code}:${z.units?.length ?? 0}`).join(', ')
  );

  await prisma.venue.update({
    where: { id: event.venueId },
    data: { seatPlan }
  });
  console.log('✓ Venue.seatPlan güncellendi');

  const inviteType = await prisma.ticketType.findFirst({
    where: {
      eventId: event.id,
      deletedAt: null,
      OR: [
        { name: ORGANIZER_INVITE_TICKET_NAME },
        { name: { contains: 'Davetiye', mode: 'insensitive' } }
      ]
    }
  });

  const sold = inviteType
    ? await prisma.purchasedTicket.count({
        where: {
          ticketTypeId: inviteType.id,
          status: { in: ['VALID', 'USED'] },
          deletedAt: null
        }
      })
    : 0;

  const capacity = Math.max(INVITE_STOCK, sold);

  if (inviteType) {
    const updated = await prisma.ticketType.update({
      where: { id: inviteType.id },
      data: { name: ORGANIZER_INVITE_TICKET_NAME, capacity, sold, status: 'active' }
    });
    console.log(
      `✓ "${updated.name}" TicketType güncellendi — kapasite ${updated.capacity}, satılan ${updated.sold}`
    );
  } else {
    const created = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: ORGANIZER_INVITE_TICKET_NAME,
        description: 'Yalnızca organizatör davetiyesi',
        price: 0,
        capacity: INVITE_STOCK,
        sold: 0,
        quantity: INVITE_STOCK,
        status: 'active',
        type: 'general',
        currency: 'TRY',
        seatsPerUnit: 1,
        saleStartDate: new Date(),
        saleEndDate: event.startDate
      }
    });
    console.log(`✓ "${created.name}" TicketType oluşturuldu — kapasite ${created.capacity}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
