import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { buildEventApprovedEmail } from '@/lib/email/event-approved-template';

/** Organizatör etkinliği admin onayından sonra bilgilendirme e-postası */
export async function sendEventApprovedEmail(eventId: string): Promise<void> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      city: true,
      venue: true,
      organizer: {
        include: {
          owner: { select: { email: true, displayName: true } }
        }
      }
    }
  });

  if (!event?.organizer.owner.email) return;

  const eventUrl = getSiteUrl(`/etkinlik/${event.slug}`);
  const panelUrl = getSiteUrl(`/organizator-panel/etkinlik/${event.id}`);
  const organizerName = event.organizer.owner.displayName || event.organizer.name;

  const html = buildEventApprovedEmail({
    organizerName,
    eventTitle: event.title,
    eventDate: event.startDate,
    eventCity: event.city.name,
    eventVenue: event.venue?.name || (event.isOnline ? 'Online' : ''),
    coverImage: event.coverImage,
    eventUrl,
    panelUrl
  });

  await queueEmail({
    to: event.organizer.owner.email,
    subject: `Etkinliğiniz onaylandı: ${event.title}`,
    template: 'event_approved',
    html
  });
}
