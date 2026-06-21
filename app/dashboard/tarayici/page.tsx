import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardScannerPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.scanner}
      description="QR kod tarayıcı ile giriş kontrolü."
    />
  );
}
