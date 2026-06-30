import { notFound, redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getSiteUrl } from '@/lib/config/domain';
import { getOrganizerEventDetail } from '@/lib/services/organizer-event-detail';
import { EventDetailDashboard } from '@/components/organizator-panel/event-detail-dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizatorEventDetailPage({ params }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const { id } = await params;
  const detail = await getOrganizerEventDetail(organizer.id, id);
  if (!detail) notFound();

  return (
    <EventDetailDashboard
      publicUrl={getSiteUrl(`/etkinlik/${detail.event.slug}`)}
      data={{
        ...detail,
        event: {
          ...detail.event,
          startDate: detail.event.startDate.toISOString(),
          endDate: detail.event.endDate.toISOString()
        },
        categories: detail.categories.map((c) => ({
          ...c,
          saleStartDate: c.saleStartDate.toISOString(),
          saleEndDate: c.saleEndDate.toISOString()
        })),
        recentOrders: detail.recentOrders.map((o) => ({
          ...o,
          paidAt: o.paidAt.toISOString()
        })),
        recentTickets: detail.recentTickets.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString()
        }))
      }}
    />
  );
}
