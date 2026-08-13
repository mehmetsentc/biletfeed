import { notFound, redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/auth/session';
import { IyzicoCheckoutPageClient } from '@/components/payments/iyzico-checkout-page-client';
import { resolveIyzicoPaymentPageAccess } from '@/lib/services/payment-page';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ pt?: string }>;
}

export const metadata = createPageMetadata({
  title: 'Güvenli Ödeme',
  path: '/odeme/guvenli',
  noIndex: true
});

export default async function IyzicoBrandedPaymentPage({
  params,
  searchParams
}: Props) {
  const { orderId } = await params;
  const { pt } = await searchParams;

  const session = await verifySessionCookie();

  const access = await resolveIyzicoPaymentPageAccess({
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

  return <IyzicoCheckoutPageClient context={access.context} />;
}
