import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SettingsPageHeader } from '@/components/account/settings-form';
import { PremiumTicketCard } from '@/components/tickets/premium-ticket-card';
import { TicketActions } from '@/components/tickets/ticket-actions';
import { TicketTransferForm } from '@/components/tickets/ticket-transfer-form';
import { getTicketById } from '@/lib/services/tickets';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';
import { verifySessionCookie } from '@/lib/auth/session';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const session = await verifySessionCookie();
  const ticket = session ? await getTicketById(id, session.uid) : undefined;
  return createPageMetadata({
    title: ticket?.eventTitle || 'Bilet',
    path: `/biletlerim/${id}`
  });
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await verifySessionCookie();
  if (!session) redirect(`/giris?redirect=/biletlerim`);

  const { id } = await params;
  const ticket = await getTicketById(id, session.uid);
  if (!ticket) notFound();

  const holderName = ticket.attendeeName || 'Misafir';

  return (
    <div className="space-y-6">
      <SettingsPageHeader title="Bilet Detayı" description={ticket.eventTitle} />

      <div className="mx-auto max-w-lg space-y-4">
        <Link
          href={`/etkinlik/${ticket.eventSlug}`}
          className="inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Etkinlik sayfasına git →
        </Link>

        <PremiumTicketCard
          id="premium-ticket-card"
          eventTitle={ticket.eventTitle}
          eventImage={ticket.eventImage}
          eventDate={formatEventDate(ticket.eventDate)}
          eventTime={formatEventTime(ticket.eventDate)}
          venue={ticket.venue}
          city={ticket.city}
          ticketType={ticket.ticketType}
          holderName={holderName}
          ticketCode={ticket.code}
          qrData={ticket.qrData}
          status={ticket.status}
          priceLabel={ticket.price > 0 ? `${ticket.price} ₺` : 'Ücretsiz'}
          eventSlug={ticket.eventSlug}
        />

        <TicketActions
          ticketId={ticket.id}
          ticketCode={ticket.code}
          validationToken={ticket.validationToken}
          eventTitle={ticket.eventTitle}
          startDate={ticket.eventDate}
          endDate={ticket.eventEndDate ?? ticket.eventDate}
          venue={ticket.venue}
          city={ticket.city}
        />

        {ticket.status === 'VALID' && !ticket.isInvitation && (
          <TicketTransferForm ticketId={ticket.id} />
        )}

        <Link
          href="/biletlerim"
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          ← Tüm Biletler
        </Link>
      </div>
    </div>
  );
}
