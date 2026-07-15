import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardSettingsPage() {
  const { t } = await getServerTranslations();
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.settings}
      description="Organizatör hesap ve bildirim ayarları."
    />
  );
}
