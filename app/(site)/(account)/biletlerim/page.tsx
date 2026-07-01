import { MyTicketsPageClient } from '@/components/account/my-tickets-page-client';
import { getPurchasedTicketsByUser } from '@/lib/services/tickets';
import { getTransferredTicketsForUser } from '@/lib/services/ticket-transfers';
import { verifySessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: 'Biletlerim',
  path: '/biletlerim'
});

export default async function MyTicketsPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/biletlerim');

  const [tickets, transfers] = await Promise.all([
    getPurchasedTicketsByUser(session.uid),
    getTransferredTicketsForUser(session.uid)
  ]);

  const transferredTicketIds = transfers.map((t) => t.ticketId);

  return (
    <MyTicketsPageClient
      key={session.uid}
      tickets={tickets}
      transferredTicketIds={transferredTicketIds}
    />
  );
}
