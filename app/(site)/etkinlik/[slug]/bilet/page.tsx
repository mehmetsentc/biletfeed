import { notFound, redirect } from 'next/navigation';
import { PurchaseEventBar } from '@/components/tickets/purchase/purchase-event-bar';
import { TicketTierList } from '@/components/tickets/purchase/ticket-tier-list';
import { getTicketPurchaseContext } from '@/lib/tickets/purchase-context';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const ctx = await getTicketPurchaseContext(slug);
  return createPageMetadata({
    title: ctx ? `Bilet Seç — ${ctx.event.title}` : 'Bilet Seç',
    path: `/etkinlik/${slug}/bilet`,
    noIndex: true
  });
}

export default async function TicketTierPage({ params }: Props) {
  const { slug } = await params;
  const ctx = await getTicketPurchaseContext(slug);
  if (!ctx) notFound();

  if (ctx.external && ctx.event.externalUrl) {
    redirect(ctx.event.externalUrl);
  }

  const { event, ticketTypes, seatPlan } = ctx;

  if (ticketTypes.length === 1 && (!seatPlan || seatPlan.layout !== 'tables')) {
    redirect(`/etkinlik/${slug}/bilet/${ticketTypes[0].id}`);
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <PurchaseEventBar event={event} backHref={`/etkinlik/${slug}`} />
      <div className="container mx-auto max-w-3xl px-4 py-6 md:py-8">
        <header className="mb-6 text-foreground">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Bilet Seçin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seatPlan?.layout === 'tables'
              ? 'Haritadan masa veya loca seçin. Her birim, kişi sayısı kadar QR bilet üretir.'
              : 'Satın almak istediğiniz bilet türünü seçin.'}
          </p>
        </header>
        <TicketTierList
          eventSlug={slug}
          ticketTypes={ticketTypes}
          seatPlan={seatPlan}
        />
      </div>
    </div>
  );
}
