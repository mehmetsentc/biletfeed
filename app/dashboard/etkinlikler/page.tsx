import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardEventsPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.events}
      description="Oluşturduğunuz etkinlikleri listeleyin ve yönetin."
    />
  );
}
