import { notFound, redirect } from 'next/navigation';
import { PurchaseEventBar } from '@/components/tickets/purchase/purchase-event-bar';
import { QuantityStep } from '@/components/tickets/purchase/quantity-step';
import {
  findTicketType,
  getTicketPurchaseContext,
  ticketTypeAvailable
} from '@/lib/tickets/purchase-context';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string; ticketTypeId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const ctx = await getTicketPurchaseContext(slug);
  return createPageMetadata({
    title: ctx ? `Adet Seç — ${ctx.event.title}` : 'Adet Seç',
    path: `/etkinlik/${slug}/bilet`,
    noIndex: true
  });
}

export default async function TicketQuantityPage({ params }: Props) {
  const { slug, ticketTypeId } = await params;
  const ctx = await getTicketPurchaseContext(slug);
  if (!ctx) notFound();

  if (ctx.external && ctx.event.externalUrl) {
    redirect(ctx.event.externalUrl);
  }

  const ticketType = findTicketType(ctx.ticketTypes, ticketTypeId);
  if (!ticketType) notFound();

  if (!ticketTypeAvailable(ticketType)) {
    redirect(`/etkinlik/${slug}/bilet`);
  }

  const backHref =
    ctx.ticketTypes.length > 1
      ? `/etkinlik/${slug}/bilet`
      : `/etkinlik/${slug}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      <PurchaseEventBar event={ctx.event} backHref={backHref} />
      <div className="container mx-auto max-w-lg px-4 py-6 md:py-8">
        <QuantityStep eventSlug={slug} ticketType={ticketType} />
      </div>
    </div>
  );
}
