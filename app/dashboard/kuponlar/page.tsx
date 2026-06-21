import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardCouponsPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.coupons}
      description="İndirim kuponları oluşturun ve yönetin."
    />
  );
}
