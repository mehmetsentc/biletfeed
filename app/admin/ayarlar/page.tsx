import { SystemSettingsPanel } from '@/components/admin/system-settings-panel';
import { getAdminSettingsSnapshot } from '@/lib/config/admin-settings-snapshot';

export default function AdminSettingsPage() {
  const snapshot = getAdminSettingsSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Salt okunur sistem yapılandırması ve ortam durumu
        </p>
      </div>
      <SystemSettingsPanel snapshot={snapshot} />
    </div>
  );
}
