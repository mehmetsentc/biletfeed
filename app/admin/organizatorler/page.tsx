import { getAdminOrganizers } from '@/lib/services/admin-dashboard';
import { OrganizerAdminPanel } from '@/components/admin/organizer-admin-panel';
import { getDefaultCommissionRate } from '@/lib/services/platform-settings';

export default async function AdminOrganizatorsPage() {
  const [organizers, defaultCommissionRate] = await Promise.all([
    getAdminOrganizers(),
    getDefaultCommissionRate()
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizatörler</h1>
        <p className="text-muted-foreground">
          {organizers.length} organizatör — onay, askıya alma ve hizmet bedeli yönetimi
        </p>
      </div>
      <OrganizerAdminPanel
        organizers={organizers}
        defaultCommissionRate={defaultCommissionRate}
      />
    </div>
  );
}
