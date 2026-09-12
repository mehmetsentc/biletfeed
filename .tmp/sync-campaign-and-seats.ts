import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import {
  buildAntyaSeatPlan,
  INVITE_STOCK,
  ORGANIZER_INVITE_TICKET_NAME,
  getInviteInventorySeats
} from '../lib/tickets/antalya-inventory';

const prisma = new PrismaClient();

async function main() {
  console.log('INVITE_STOCK', INVITE_STOCK, getInviteInventorySeats().length);
  const event = await prisma.event.findFirst({
    where: { slug: 'gipsy-kings-by-andre-reyes', deletedAt: null },
    select: { id: true, venueId: true, venue: { select: { seatPlan: true } } }
  });
  if (!event?.venueId) throw new Error('no venue');
  let mapUrl: string | undefined;
  const prev = event.venue?.seatPlan;
  if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
    const maybe = (prev as Record<string, unknown>).mapImageUrl;
    if (typeof maybe === 'string') mapUrl = maybe;
  }
  const seatPlan = buildAntyaSeatPlan(mapUrl);
  console.log(
    'DAVETIYE',
    seatPlan.zones.find((z) => z.code === 'DAVETIYE')?.units.length
  );
  await prisma.venue.update({ where: { id: event.venueId }, data: { seatPlan } });
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
  if (!inviteType) throw new Error('missing invite type');
  const sold = await prisma.purchasedTicket.count({
    where: {
      ticketTypeId: inviteType.id,
      status: { in: ['VALID', 'USED'] },
      deletedAt: null
    }
  });
  const capacity = Math.max(INVITE_STOCK, sold);
  await prisma.ticketType.update({
    where: { id: inviteType.id },
    data: {
      name: ORGANIZER_INVITE_TICKET_NAME,
      capacity,
      sold,
      status: 'active',
      price: 0
    }
  });
  console.log('cap', capacity, 'sold', sold, 'free', capacity - sold);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
