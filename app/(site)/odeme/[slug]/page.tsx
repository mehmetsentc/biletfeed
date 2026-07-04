import { notFound, redirect } from 'next/navigation';
import { CheckoutForm } from './checkout-form';
import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { getEventRulesDisplay } from '@/lib/services/event-rules-display';
import { isExternalListing } from '@/lib/events/ticket-url';
import { createPageMetadata } from '@/lib/seo/metadata';
import { resolveLocaleFromCookie } from '@/lib/event-rules/i18n';
import { cookies } from 'next/headers';

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

  const ticketTypes = await getCheckoutTicketTypes(slug);
  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get('bf-locale')?.value);
  const rulesDisplay = await getEventRulesDisplay(event.id, locale);

  return <CheckoutForm event={event} ticketTypes={ticketTypes} rulesDisplay={rulesDisplay} />;
}
