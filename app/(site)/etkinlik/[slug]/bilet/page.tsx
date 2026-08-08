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

  const { event, ticketTypes, seatPlan, soldSeatIds } = ctx;

  const isSeatMapLayout =
    seatPlan?.layout === 'tables' || seatPlan?.layout === 'sections';

  if (ticketTypes.length === 1 && !isSeatMapLayout) {
    redirect(`/etkinlik/${slug}/bilet/${ticketTypes[0].id}`);
  }

  const isSections = seatPlan?.layout === 'sections';

  const containerClass = isSections
    ? 'container mx-auto max-w-6xl px-4 py-4 md:py-6'
    : seatPlan?.layout === 'tables'
      ? 'container mx-auto max-w-4xl px-4 py-6 md:py-8'
      : 'container mx-auto max-w-3xl px-4 py-6 md:py-8';

  const subtitle =
    seatPlan?.layout === 'tables'
      ? 'Haritadan masa veya loca seçin. Her birim, kişi sayısı kadar QR bilet üretir.'
      : isSections
        ? 'Amfiden koltuk seçin. Renkli noktalar tahsisli müsait koltuklar; gri noktalar satılamaz.'
        : 'Satın almak istediğiniz bilet türünü seçin.';

  return (
    <div className="bg-background pb-10">
      <PurchaseEventBar event={event} backHref={`/etkinlik/${slug}`} />
      <div className={containerClass}>
        {!isSections && (
          <header className="mb-6 text-foreground">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Bilet Seçin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </header>
        )}
        {isSections && (
          <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>
        )}
        <TicketTierList
          eventSlug={slug}
          ticketTypes={ticketTypes}
          seatPlan={seatPlan}
          soldSeatIds={soldSeatIds}
        />
      </div>
    </div>
  );
}
