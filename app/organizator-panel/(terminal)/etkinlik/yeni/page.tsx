import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { resolveScannerUser } from '@/lib/auth/organizer-api';
import { CreateOrganizerEventWizard } from '@/components/organizator-panel/create-event-wizard';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { isOrganizerProfileComplete } from '@/lib/services/organizer-profile-readiness';
import { redirectToPanel, redirectToPanelLogin } from '@/lib/auth/panel-paths-server';

export default async function OrganizatorCreateEventPage() {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    return redirectToPanelLogin('/etkinlik/yeni');
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
    return redirectToPanel('/kurulum');
  }

  if (!isOrganizerProfileComplete(organizer, user?.email)) {
    return redirectToPanel('/ayarlar?complete=1');
  }

  return <CreateOrganizerEventWizard />;
}
