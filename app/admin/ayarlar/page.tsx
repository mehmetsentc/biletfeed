import { SystemSettingsPanel } from '@/components/admin/system-settings-panel';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Sistem yapılandırması ve özellik bayrakları</p>
      </div>
      <SystemSettingsPanel />
    </div>
  );
}
