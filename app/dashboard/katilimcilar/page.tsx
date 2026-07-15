import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardAttendeesPage() {
  const { t } = await getServerTranslations();
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.attendees}
      description="Katılımcı listeleri ve check-in durumu."
    />
  );
}
