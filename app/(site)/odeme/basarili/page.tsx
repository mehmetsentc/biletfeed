import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrderForUser } from '@/lib/services/orders';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Ödeme Başarılı',
  path: '/odeme/basarili'
});

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;

  let ticketCount: number | undefined;
  let eventTitle: string | undefined;

  if (orderId) {
    const session = await verifySessionCookie();
    if (session) {
      const order = await getOrderForUser({
        orderId,
        firebaseUid: session.uid
      });
      if (order?.status === 'pending') {
        redirect(`/odeme/islem/${orderId}`);
      }
      if (order?.status === 'paid') {
        ticketCount = order.purchasedTickets.length;
        eventTitle = order.event.title;
      }
    }
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="size-10 text-emerald-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">Ödeme Başarılı!</h1>
      <p className="mt-2 text-muted-foreground">
        {eventTitle ? (
          <>
            <strong>{eventTitle}</strong> için{' '}
            {ticketCount ? `${ticketCount} adet ` : ''}biletiniz oluşturuldu.
          </>
        ) : (
          'Biletiniz oluşturuldu. QR kodunuzu Biletlerim sayfasından görüntüleyebilirsiniz.'
        )}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/biletlerim">
          <Button className="gap-2">
            <Ticket className="size-4" />
            Biletlerimi Gör
          </Button>
        </Link>
        <Link href="/etkinlikler">
          <Button variant="outline">Daha Fazla Etkinlik</Button>
        </Link>
      </div>
    </div>
  );
}
