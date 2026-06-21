import { notFound, redirect } from 'next/navigation';
import { CheckoutForm } from './checkout-form';
import { getEventBySlug } from '@/lib/services/events';
import { isExternalListing } from '@/lib/events/ticket-url';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return createPageMetadata({
    title: event ? `Ödeme - ${event.title}` : 'Ödeme',
    path: `/odeme/${slug}`
  });
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  if (isExternalListing(event) && event.externalUrl) {
    redirect(event.externalUrl);
  }

  return <CheckoutForm event={event} />;
}
