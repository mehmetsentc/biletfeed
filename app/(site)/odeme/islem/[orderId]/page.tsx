import { notFound, redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { isMockPaymentAllowed } from '@/lib/payments/config';
import { getOrderForUser } from '@/lib/services/orders';
import { MockPaymentClient } from './mock-payment-client';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ session?: string }>;
}

export const metadata = createPageMetadata({
  title: 'Ödeme İşlemi',
  path: '/odeme/islem',
  noIndex: true
});

export default async function MockPaymentPage({ params, searchParams }: Props) {
  if (!isMockPaymentAllowed()) {
    redirect('/yardim');
  }

  const session = await verifySessionCookie();
  if (!session) {
    redirect('/giris');
  }

  const { orderId } = await params;
  const { session: paymentSession } = await searchParams;

  const order = await getOrderForUser({
    orderId,
    firebaseUid: session.uid
  });

  if (!order) notFound();

  if (order.status === 'paid') {
    redirect(`/etkinlik/${order.event.slug}/bilet/basarili?order=${orderId}`);
  }

  if (order.status !== 'pending') {
    redirect(`/odeme/basarisiz?order=${orderId}`);
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <MockPaymentClient
        orderId={order.id}
        sessionId={paymentSession || order.paymentSessionId || undefined}
        total={order.total}
        eventTitle={order.event.title}
        eventSlug={order.event.slug}
      />
    </div>
  );
}
