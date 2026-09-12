import { PrismaClient } from '@prisma/client';
import {
  buildAntyaSeatPlan,
  INVITE_STOCK,
  ORGANIZER_INVITE_TICKET_NAME,
  getInviteInventorySeats
} from '../lib/tickets/antalya-inventory';

const prisma = new PrismaClient();

async function main() {
  const invites = getInviteInventorySeats();
  console.log('invite count', INVITE_STOCK, 'actual', invites.length);

  const byRow = new Map<string, number>();
  for (const s of invites) {
    byRow.set(s.row, (byRow.get(s.row) ?? 0) + 1);
  }
  console.log('by row', Object.fromEntries([...byRow.entries()].sort()));

  const batch = invites.filter((s) =>
    ['P', 'S', 'T', 'Z1', 'Z2', 'Z5'].includes(s.row)
  );
  console.log(
    'new P/S/T/Z batch',
    batch.length,
    batch.slice(0, 5).map((s) => s.id),
    '...',
    batch.slice(-3).map((s) => s.id)
  );

  const event = await prisma.event.findFirst({
    where: { slug: 'gipsy-kings-by-andre-reyes', deletedAt: null },
    select: { id: true, venueId: true, venue: { select: { id: true, seatPlan: true } } }
  });
  if (!event?.venueId) throw new Error('no venue');

  const prevPlan = event.venue?.seatPlan;
  let mapUrl: string | undefined;
  if (prevPlan && typeof prevPlan === 'object' && !Array.isArray(prevPlan)) {
    const maybe = (prevPlan as Record<string, unknown>).mapImageUrl;
    if (typeof maybe === 'string') mapUrl = maybe;
  }

  const seatPlan = buildAntyaSeatPlan(mapUrl);
  const dav = seatPlan.zones.find((z) => z.code === 'DAVETIYE');
  console.log('DAVETIYE units', dav?.units.length);

  await prisma.venue.update({
    where: { id: event.venueId },
    data: { seatPlan }
  });

  const existing = await prisma.ticketType.findFirst({
    where: {
      eventId: event.id,
      deletedAt: null,
      OR: [
        { name: ORGANIZER_INVITE_TICKET_NAME },
        { name: 'Özel Bölüm' },
        { name: { contains: 'Davetiye', mode: 'insensitive' } }
      ]
    }
  });
  if (!existing) throw new Error('Organizator Davetiye ticket type missing');

  const sold = await prisma.purchasedTicket.count({
    where: {
      ticketTypeId: existing.id,
      status: { in: ['VALID', 'USED'] },
      deletedAt: null
    }
  });

  const capacity = Math.max(INVITE_STOCK, sold);
  const updated = await prisma.ticketType.update({
    where: { id: existing.id },
    data: {
      name: ORGANIZER_INVITE_TICKET_NAME,
      description:
        'Organizator davetiye — haritada yok; yalnızca davetiyede yer numarası',
      price: 0,
      capacity,
      sold,
      status: 'active',
      type: 'general'
    }
  });
  console.log(
    'updated',
    updated.id,
    updated.name,
    'cap',
    updated.capacity,
    'sold',
    updated.sold
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
