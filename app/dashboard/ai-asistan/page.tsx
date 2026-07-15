import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardAiPage() {
  const { t } = await getServerTranslations();
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.aiAssistant}
      description="Etkinlik açıklaması ve pazarlama metinleri için AI asistan."
    />
  );
}
