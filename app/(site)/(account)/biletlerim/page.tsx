import { MyTicketsPageClient } from '@/components/account/my-tickets-page-client';
import { getPurchasedTicketsByUser } from '@/lib/services/tickets';
import { verifySessionCookie } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Biletlerim',
  path: '/biletlerim'
});

export default async function MyTicketsPage() {
  const session = await verifySessionCookie();
  if (!session) redirect('/giris?redirect=/biletlerim');

  const tickets = await getPurchasedTicketsByUser(session.uid);

  return <MyTicketsPageClient tickets={tickets} />;
}
