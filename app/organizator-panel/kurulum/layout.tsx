import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';

export default async function OrganizatorKurulumLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await verifySessionCookie();
  if (!session) {
    redirect('/giris?redirect=/organizator-panel/kurulum');
  }

  const organizer = await getOrganizerForSession(session.uid);
  if (organizer) {
    redirect('/organizator-panel/baslangic');
  }

  return children;
}
