import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  const e = await p.event.findFirst({
    where: { slug: 'gipsy-kings-by-andre-reyes', deletedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
      organizer: { select: { name: true, slug: true } },
      ticketTypes: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          price: true,
          capacity: true,
          sold: true,
          status: true
        }
      }
    }
  });
  console.log(JSON.stringify(e, null, 2));
  if (e) {
    const sentActive = await p.eventInvitation.count({
      where: { eventId: e.id, deletedAt: null, status: { not: 'cancelled' } }
    });
    const cancelled = await p.eventInvitation.count({
      where: { eventId: e.id, deletedAt: null, status: 'cancelled' }
    });
    console.log({ sentActive, cancelled, remainingInviteSeats: null });
    const dav = e.ticketTypes.find((t) =>
      t.name.toLowerCase().includes('davetiye')
    );
    if (dav) {
      console.log({
        inviteRemaining: dav.capacity - dav.sold,
        inviteStatus: dav.status
      });
    }
  }
  await p.$disconnect();
}
main();
