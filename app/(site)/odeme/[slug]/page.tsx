import { redirect } from 'next/navigation';
import { createPageMetadata } from '@/lib/seo/metadata';
import { getEventBySlug } from '@/lib/services/events';

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
  redirect(`/etkinlik/${slug}/bilet`);
}
