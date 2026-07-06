import { notFound, redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { ToslaPaymentPageClient } from '@/components/payments/tosla-payment-page-client';
import { resolvePaymentPageAccess } from '@/lib/services/payment-page';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ pt?: string }>;
}

export const metadata = createPageMetadata({
  title: 'Kart ile Ödeme',
  path: '/odeme/kart',
  noIndex: true
});

export default async function ToslaCardPaymentPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { pt } = await searchParams;

  const session = await verifySessionCookie();

  const access = await resolvePaymentPageAccess({
    orderId,
    firebaseUid: session?.uid,
    accessToken: pt
  });

  if (access.type === 'paid') {
    redirect(`/odeme/basarili?order=${access.orderId}`);
  }

  if (access.type === 'denied') {
    notFound();
  }

  return <ToslaPaymentPageClient context={access.context} />;
}
