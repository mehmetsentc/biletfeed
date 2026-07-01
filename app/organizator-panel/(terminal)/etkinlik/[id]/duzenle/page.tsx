import { notFound, redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { mapEventToWizardInitialData } from '@/lib/organizator/event-wizard-data';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { CreateOrganizerEventWizard } from '@/components/organizator-panel/create-event-wizard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizatorEditEventPage({ params }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, organizerId: organizer.id, deletedAt: null },
    include: {
      city: true,
      venue: true,
      category: true,
      ticketTypes: {
        where: { deletedAt: null },
        orderBy: { price: 'asc' }
      }
    }
  });

  if (!event) notFound();

  return (
    <CreateOrganizerEventWizard
      mode="edit"
      eventId={event.id}
      initialData={mapEventToWizardInitialData(event)}
    />
  );
}
