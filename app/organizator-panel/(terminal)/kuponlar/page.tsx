import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { listOrganizerCouponEventOptions, listOrganizerCoupons } from '@/lib/services/coupons';
import { OrganizerCouponsPanel } from '@/components/organizator-panel/organizer-coupons-panel';
import { redirectToPanel } from '@/lib/auth/panel-paths-server';

export default async function OrganizatorCouponsPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (!organizer) return redirectToPanel('/kurulum');

  const [coupons, events] = await Promise.all([
    listOrganizerCoupons(organizer.id),
    listOrganizerCouponEventOptions(organizer.id)
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kuponlar</h1>
        <p className="text-sm text-muted-foreground">
          İndirim kuponunu bir etkinliğe bağlayın. 3 Ekim ve 4 Ekim konserleri için ayrı
          kod tanımlayabilirsiniz.
        </p>
      </div>
      <OrganizerCouponsPanel
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate.toISOString()
        }))}
        initialCoupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          assignedLabel: c.assignedLabel,
          type: c.type,
          value: c.value,
          usedCount: c.usedCount,
          maxUses: c.maxUses,
          active: c.active,
          validUntil: c.validUntil.toISOString(),
          eventId: c.eventId,
          eventTitle: c.event?.title ?? null,
          eventStartDate: c.event?.startDate.toISOString() ?? null
        }))}
      />
    </div>
  );
}
