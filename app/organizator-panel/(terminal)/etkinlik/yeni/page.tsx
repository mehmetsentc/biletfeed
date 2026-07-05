import { redirect } from 'next/navigation';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { resolveScannerUser } from '@/lib/auth/organizer-api';
import { CreateOrganizerEventWizard } from '@/components/organizator-panel/create-event-wizard';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { isOrganizerProfileComplete } from '@/lib/services/organizer-profile-readiness';

export default async function OrganizatorCreateEventPage() {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect('/organizator-panel/giris?redirect=/organizator-panel/etkinlik/yeni');
  }

  await ensureDbConnection();
  const user = await resolveScannerUser(session.uid, session.email);
  const organizer = user
    ? await prisma.organizer.findFirst({
        where: { ownerId: user.id, deletedAt: null },
        select: { name: true, contactEmail: true, status: true }
      })
    : null;

  if (!organizer) {
    redirect('/organizator-panel/kurulum');
  }

  if (!isOrganizerProfileComplete(organizer)) {
    redirect('/organizator-panel/ayarlar?complete=1');
  }

  return <CreateOrganizerEventWizard />;
}
