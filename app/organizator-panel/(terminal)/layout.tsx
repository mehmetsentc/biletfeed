import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { resolveScannerUser } from '@/lib/auth/organizer-api';
import { OrganizatorShell } from '@/components/organizator-panel/shell';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { ensureOrganizerContactEmail } from '@/lib/services/organizer-panel';
import { panelServerLoginPath, panelServerPath } from '@/lib/auth/panel-paths';

export default async function OrganizatorTerminalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get('host');
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect(panelServerLoginPath(host, '/baslangic'));
  }

  await ensureDbConnection();
  const user = await resolveScannerUser(session.uid, session.email);
  const organizer = user
    ? await prisma.organizer.findFirst({
        where: { ownerId: user.id, deletedAt: null }
      })
    : null;

  if (!organizer) {
    redirect(panelServerPath('/kurulum', host));
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
