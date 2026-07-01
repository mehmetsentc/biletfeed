import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { resolveScannerUser } from '@/lib/auth/organizer-api';
import { OrganizatorShell } from '@/components/organizator-panel/shell';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export default async function OrganizatorTerminalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await verifySessionCookie();
  if (!session) {
    redirect('/giris?redirect=/organizator-panel/baslangic');
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

  return (
    <OrganizatorShell
      organizationName={organizer.name}
      displayName={user?.displayName || session.email || 'Organizatör'}
    >
      {children}
    </OrganizatorShell>
  );
}
