import { OrganizatorContactPage } from '@/components/organizator-panel/organizator-contact-page';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSupportTickets } from '@/lib/services/organizer-panel';
import { ensureDbConnection } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';

export default async function OrganizatorIletisimPage() {
  const session = await verifySessionCookie();
  if (!session) {
    redirect('/giris?redirect=/organizator-panel/iletisim');
  }

  await ensureDbConnection();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) {
    redirect('/organizator-panel/kurulum');
  }

  const tickets = await getOrganizerSupportTickets(organizer.id);

  return (
    <OrganizatorContactPage
      initialTickets={tickets.map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        body: ticket.body,
        status: ticket.status,
        reply: ticket.reply,
        createdAt: ticket.createdAt.toISOString()
      }))}
    />
  );
}
