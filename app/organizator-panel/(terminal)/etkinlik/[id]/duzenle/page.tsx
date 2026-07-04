import { notFound, redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { mapEventToWizardInitialData } from '@/lib/organizator/event-wizard-data';
import { getEventRuleSet } from '@/lib/services/event-rules-query';
import { getOrganizerEventSeriesForWizard } from '@/lib/services/event-series';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { CreateOrganizerEventWizard } from '@/components/organizator-panel/create-event-wizard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizatorEditEventPage({ params }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid, session.email);
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

  if (!event || !event.category || !event.city) notFound();

  let ruleSetData: Awaited<ReturnType<typeof getEventRuleSet>> = {
    ruleSet: null,
    announcements: []
  };
  try {
    ruleSetData = await getEventRuleSet(event.id);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[organizer/edit-event] getEventRuleSet failed', err);
    }
  }

  const seriesSessions = await getOrganizerEventSeriesForWizard(
    organizer.id,
    event.id,
    event.seo
  );

  return (
    <CreateOrganizerEventWizard
      mode="edit"
      eventId={event.id}
      initialData={mapEventToWizardInitialData(event, ruleSetData, seriesSessions)}
      initialStatus={event.status}
    />
  );
}
