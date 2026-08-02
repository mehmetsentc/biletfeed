import { OrganizatorContactPage } from '@/components/organizator-panel/organizator-contact-page';
import { verifyOrganizerPanelSession } from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSupportTickets } from '@/lib/services/organizer-panel';
import { ensureDbConnection } from '@/lib/db/prisma';
import { redirectToPanel, redirectToPanelLogin } from '@/lib/auth/panel-paths-server';

export default async function OrganizatorIletisimPage() {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    return redirectToPanelLogin('/iletisim');
  }

  await ensureDbConnection();
  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (!organizer) {
    return redirectToPanel('/kurulum');
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
