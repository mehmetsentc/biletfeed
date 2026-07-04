import { DashboardPlaceholderPage } from '@/components/dashboard/placeholder-page';
import { getTranslations } from '@/lib/i18n';

const t = getTranslations();

export default function DashboardAttendeesPage() {
  return (
    <DashboardPlaceholderPage
      title={t.dashboard.attendees}
      description="Katılımcı listeleri ve check-in durumu."
    />
  );
}
