import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrderForUser } from '@/lib/services/orders';
import { createPageMetadata } from '@/lib/seo/metadata';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';

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
    <div className="relative min-h-[70vh] overflow-hidden bg-zinc-50">
      <div
        className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-primary via-bf-orange-400 to-bf-orange-600"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-32 w-20 bg-[#1A1A1A] opacity-20"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        aria-hidden
      />

      <div className="relative container mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandAssetUrl(brandLogos.forDarkSurface)}
          alt="BiletFeed"
          className="mb-8 h-8 w-auto"
        />

        <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-orange-100/40">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-50">
            <CheckCircle2 className="size-8 text-primary" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-zinc-900">Biletiniz hazır!</h1>
          <p className="mt-3 text-muted-foreground">
            {eventTitle ? (
              <>
                <strong className="text-foreground">{eventTitle}</strong> için{' '}
                {ticketCount ? `${ticketCount} adet ` : ''}biletiniz oluşturuldu.
              </>
            ) : (
              'QR kodunuzu Biletlerim sayfasından görüntüleyebilirsiniz.'
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/biletlerim">
              <Button className="h-12 w-full gap-2 rounded-xl text-base font-bold">
                <Ticket className="size-5" />
                Biletlerimi Gör
              </Button>
            </Link>
            <Link href="/etkinlikler">
              <Button variant="outline" className="h-11 w-full rounded-xl">
                Daha Fazla Etkinlik
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
