import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardSettingsPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.settings}
      description="Organizatör hesap ve bildirim ayarları."
    />
  );
}
