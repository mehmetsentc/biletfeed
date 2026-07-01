import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
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
  const user = await prisma.user.findFirst({
    where: { firebaseUid: session.uid, deletedAt: null }
  });
  const organizer = await getOrganizerForSession(session.uid, session.email);

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
