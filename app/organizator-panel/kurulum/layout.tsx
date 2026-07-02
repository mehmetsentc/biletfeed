import { redirect } from 'next/navigation';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';

export default async function OrganizatorKurulumLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect('/organizator-panel/giris?redirect=/organizator-panel/kurulum');
  }

  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (organizer) {
    redirect('/organizator-panel/baslangic');
  }

  return children;
}
