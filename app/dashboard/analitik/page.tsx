import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardAnalyticsPage() {
  const { t } = await getServerTranslations();
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.analytics}
      description="Satış, trafik ve katılım analizleri."
    />
  );
}
