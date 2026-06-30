import Link from 'next/link';
import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardCouponsPage() {
  return (
    <div className="space-y-4">
      <DashboardPlaceholderPage
        title={t.dashboard.coupons}
        description="Kupon yönetimi organizatör panelinden yapılır."
      />
      <Link
        href="/organizator-panel/kuponlar"
        className="inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Organizatör Kuponları →
      </Link>
    </div>
  );
}
