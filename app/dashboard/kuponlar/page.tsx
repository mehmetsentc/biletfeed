import Link from 'next/link';
import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { panelHref } from '@/lib/config/domain';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardCouponsPage() {
  const { t } = await getServerTranslations();
  return (
    <div className="space-y-4">
      <DashboardPlaceholderPage
        title={t.dashboard.coupons}
        description="Kupon yönetimi organizatör panelinden yapılır."
      />
      <Link
        href={panelHref('/organizator-panel/kuponlar')}
        className="text-sm font-medium text-primary underline"
      >
        Organizatör paneline git →
      </Link>
    </div>
  );
}
