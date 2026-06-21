import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardOrdersPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.orders}
      description="Sipariş geçmişi ve ödeme kayıtları."
    />
  );
}
