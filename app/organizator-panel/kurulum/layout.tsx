import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { panelServerLoginPath, panelServerPath } from '@/lib/auth/panel-paths';

export default async function OrganizatorKurulumLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get('host');
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect(panelServerLoginPath(host, '/kurulum'));
  }

  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (organizer) {
    redirect(panelServerPath('/baslangic', host));
  }

  return children;
}
