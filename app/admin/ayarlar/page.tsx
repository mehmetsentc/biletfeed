import { SystemSettingsPanel } from '@/components/admin/system-settings-panel';
import { getAdminSettingsSnapshot } from '@/lib/config/admin-settings-snapshot';
import { getDefaultCommissionRate } from '@/lib/services/platform-settings';

export default async function AdminSettingsPage() {
  const defaultCommissionRate = await getDefaultCommissionRate();
  const snapshot = getAdminSettingsSnapshot(defaultCommissionRate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Sistem yapılandırması, hizmet bedeli ve ortam durumu
        </p>
      </div>
      <SystemSettingsPanel
        snapshot={snapshot}
        defaultCommissionRate={defaultCommissionRate}
      />
    </div>
  );
}
