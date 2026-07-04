import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardAnalyticsPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.analytics}
      description="Satış, trafik ve katılım analizleri."
    />
  );
}
