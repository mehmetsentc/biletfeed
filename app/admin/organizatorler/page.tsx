import { getAdminOrganizers } from '@/lib/services/admin-dashboard';
import { OrganizerAdminPanel } from '@/components/admin/organizer-admin-panel';

export default async function AdminOrganizatorsPage() {
  const organizers = await getAdminOrganizers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizatörler</h1>
        <p className="text-muted-foreground">
          {organizers.length} organizatör — onay, askıya alma ve komisyon yönetimi
        </p>
      </div>
      <OrganizerAdminPanel organizers={organizers} />
    </div>
  );
}
