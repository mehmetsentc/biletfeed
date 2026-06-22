import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { listOrganizerEventsDetailed } from '@/lib/services/organizer-events';
import { EventManagementTable } from '@/components/organizator-panel/event-management-table';

export default async function OrganizatorEventsPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const events = await listOrganizerEventsDetailed(organizer.id);

  const rows = events.map((e) => ({
    id: e.id,
    slug: e.slug,
    displayId: e.displayId,
    title: e.title,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    status: e.status,
    ticketSold: e.ticketSold,
    ticketCapacity: e.ticketCapacity,
    venue: e.venue,
    category: e.category
  }));

  return (
    <EventManagementTable events={rows} organizationName={organizer.name} />
  );
}
