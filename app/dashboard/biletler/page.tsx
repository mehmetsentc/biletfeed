import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardTicketsPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.tickets}
      description="Bilet türlerini ve satış durumunu takip edin."
    />
  );
}
