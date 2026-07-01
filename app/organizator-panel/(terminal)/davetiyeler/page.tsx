import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { InvitationsPanel } from '@/components/organizator-panel/invitations-panel';

interface PageProps {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function OrganizatorInvitationsPage({ searchParams }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const { eventId } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Davetiye Yönetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tekli veya toplu davetiye gönderin. PDF otomatik oluşturulur; e-posta, WhatsApp veya ZIP
          ile paylaşın.
        </p>
      </div>
      <InvitationsPanel initialEventId={eventId} />
    </div>
  );
}
