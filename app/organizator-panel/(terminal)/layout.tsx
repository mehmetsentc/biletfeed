import { redirect } from 'next/navigation';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { resolveScannerUser } from '@/lib/auth/organizer-api';
import { OrganizatorShell } from '@/components/organizator-panel/shell';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ensureOrganizerContactEmail } from '@/lib/services/organizer-panel';

export default async function OrganizatorTerminalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect('/organizator-panel/giris?redirect=/organizator-panel/baslangic');
  }

  await ensureDbConnection();
  const user = await resolveScannerUser(session.uid, session.email);
  const organizer = user
    ? await prisma.organizer.findFirst({
        where: { ownerId: user.id, deletedAt: null }
      })
    : null;

  if (!organizer) {
    redirect('/organizator-panel/kurulum');
  }

  if (user) {
    await ensureOrganizerContactEmail(organizer.id, user.email);
  }

  return (
    <OrganizatorShell
      organizationName={organizer.name}
      displayName={user?.displayName || session.email || 'Organizatör'}
      userEmail={user?.email || session.email}
    >
      {children}
    </OrganizatorShell>
  );
}
