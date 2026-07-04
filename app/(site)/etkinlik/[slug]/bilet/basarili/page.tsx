import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, Ticket } from 'lucide-react';
import { PurchaseSuccessTicket } from '@/components/tickets/purchase/purchase-success-ticket';
import { Button } from '@/components/ui/button';
import { verifySessionCookie } from '@/lib/auth/session';
import { getPaidOrderFirstTicket, getOrderForUser } from '@/lib/services/orders';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return createPageMetadata({
    title: 'Biletiniz Hazır',
    path: `/etkinlik/${slug}/bilet/basarili`,
    noIndex: true
  });
}

export default async function TicketPurchaseSuccessPage({
  params,
  searchParams
}: Props) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;

  if (!orderId) notFound();

  const session = await verifySessionCookie();

  if (session) {
    const pendingOrder = await getOrderForUser({
      orderId,
      firebaseUid: session.uid
    });
    if (pendingOrder?.status === 'pending') {
      redirect(`/odeme/islem/${orderId}`);
    }
  }

  const ticketData = session
    ? await getPaidOrderFirstTicket({
        orderId,
        firebaseUid: session.uid,
        eventSlug: slug
      })
    : null;

  if (ticketData) {
    return (
      <PurchaseSuccessTicket
        eventTitle={ticketData.eventTitle}
        eventDate={formatEventDate(ticketData.eventDate.toISOString())}
        eventTime={formatEventTime(ticketData.eventDate.toISOString())}
        venue={ticketData.venue}
        city={ticketData.city}
        category={ticketData.category}
        ticketTypeName={ticketData.ticket.ticketTypeName}
        holderName={ticketData.ticket.holderName}
        ticketCode={ticketData.ticket.ticketCode}
        qrData={ticketData.ticket.qrData}
        ticketId={ticketData.ticket.id}
        validationToken={ticketData.ticket.validationToken}
        eventSlug={slug}
      />
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#FFF4E8]">
        <CheckCircle2 className="size-10 text-[#FF8A00]" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Ödeme Başarılı!</h1>
      <p className="mt-2 text-muted-foreground">
        Biletiniz oluşturuldu. QR kodunuzu e-postanızdan veya Biletlerim
        sayfasından görüntüleyebilirsiniz.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/biletlerim">
          <Button className="gap-2 bg-[#FF8A00] hover:bg-[#F57C00]">
            <Ticket className="size-4" />
            Biletlerimi Gör
          </Button>
        </Link>
        <Link href={`/etkinlik/${slug}`}>
          <Button variant="outline">Etkinlik Detayı</Button>
        </Link>
      </div>
    </div>
  );
}
