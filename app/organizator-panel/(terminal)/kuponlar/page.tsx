import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { listOrganizerCoupons } from '@/lib/services/coupons';
import { OrganizerCouponsPanel } from '@/components/organizator-panel/organizer-coupons-panel';
import { redirect } from 'next/navigation';

export default async function OrganizatorCouponsPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const coupons = await listOrganizerCoupons(organizer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kuponlar</h1>
        <p className="text-sm text-muted-foreground">
          İndirim kuponları oluşturun ve satışlarda kullanılmasını sağlayın.
        </p>
      </div>
      <OrganizerCouponsPanel
        initialCoupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          usedCount: c.usedCount,
          maxUses: c.maxUses,
          active: c.active,
          validUntil: c.validUntil.toISOString(),
          eventId: c.eventId
        }))}
      />
    </div>
  );
}
