import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardAiPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.aiAssistant}
      description="Etkinlik açıklaması ve pazarlama metinleri için AI asistan."
    />
  );
}
