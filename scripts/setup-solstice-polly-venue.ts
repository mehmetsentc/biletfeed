/**
 * SOLSTICE x SHIMZA — Polly Türkbükü oturma planı venue + paket bilet düzeltmesi
 *
 * npx dotenv -e .env.local -- tsx scripts/setup-solstice-polly-venue.ts
 */
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import { buildSolsticePollySeatPlan } from '../lib/tickets/seat-packages';
import { uniqueSlug } from '../lib/utils/slug';

const EVENT_ID = '8c9fd920-16d4-4e5a-9d7d-04ace93350a5';
const MAP_PATH = '/venues/solstice-polly-oturma-plani.png';

async function main() {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: EVENT_ID, deletedAt: null },
    include: {
      organizer: true,
      city: true,
      venue: true,
      ticketTypes: { where: { deletedAt: null } }
    }
  });

  if (!event) {
    throw new Error(`Etkinlik bulunamadı: ${EVENT_ID}`);
  }

  const seatPlan = buildSolsticePollySeatPlan(MAP_PATH);
  const guestCapacity = seatPlan.zones.reduce(
    (sum, z) => sum + z.units.length * z.seatsPerUnit,
    0
  );

  let venue = await prisma.venue.findFirst({
    where: {
      organizerId: event.organizerId,
      deletedAt: null,
      name: { contains: 'Solstice', mode: 'insensitive' }
    }
  });

  if (!venue) {
    const slug = await uniqueSlug(
      `polly-turkbuku-solstice-${event.organizer.slug}`,
      async (s) => Boolean(await prisma.venue.findUnique({ where: { slug: s } }))
    );
    venue = await prisma.venue.create({
      data: {
        slug,
        name: 'Polly Türkbükü — Solstice Floor',
        address: event.venue?.address || 'Polly Beach Club, Türkbükü / Muğla',
        cityId: event.cityId,
        organizerId: event.organizerId,
        capacity: guestCapacity,
        description:
          'SOLSTICE x SHIMZA oturma planı: Superior, Premium, Middle, Bistro ve Dock kategorileri.',
        seatPlan
      }
    });
    console.log('Venue oluşturuldu:', venue.id, venue.slug);
  } else {
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: {
        seatPlan,
        capacity: guestCapacity,
        name: 'Polly Türkbükü — Solstice Floor'
      }
    });
    console.log('Venue güncellendi:', venue.id);
  }

  await prisma.event.update({
    where: { id: event.id },
    data: { venueId: venue.id, capacity: guestCapacity }
  });
  console.log('Etkinlik venue bağlandı, capacity=', guestCapacity);

  let fixed = 0;
  for (const tt of event.ticketTypes) {
    const seats =
      tt.seatsPerUnit > 1
        ? tt.seatsPerUnit
        : tt.capacity > 1 && tt.capacity <= 10 && tt.sold === 0
          ? tt.capacity
          : 1;

    if (seats > 1 && (tt.seatsPerUnit !== seats || tt.capacity !== 1)) {
      await prisma.ticketType.update({
        where: { id: tt.id },
        data: {
          seatsPerUnit: seats,
          capacity: 1,
          quantity: 1
        }
      });
      fixed += 1;
    }
  }
  console.log(`Paket bilet düzeltilen tür: ${fixed}`);

  const summary = await prisma.ticketType.groupBy({
    by: ['seatsPerUnit'],
    where: { eventId: EVENT_ID, deletedAt: null },
    _count: { _all: true }
  });
  console.log('seatsPerUnit dağılımı:', summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
