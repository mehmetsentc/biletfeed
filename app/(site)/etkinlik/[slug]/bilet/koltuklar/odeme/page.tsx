import { notFound, redirect } from 'next/navigation';
import { PurchaseEventBar } from '@/components/tickets/purchase/purchase-event-bar';
import { PurchaseCheckoutForm } from '@/components/tickets/purchase/purchase-checkout-form';
import { getTicketPurchaseContext } from '@/lib/tickets/purchase-context';
import {
  findTicketType,
  ticketTypeAvailable
} from '@/lib/tickets/purchase-types';
import { getEventRulesDisplay } from '@/lib/services/event-rules-display';
import { resolveLocaleFromCookie } from '@/lib/event-rules/i18n';
import { createPageMetadata } from '@/lib/seo/metadata';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ids?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const ctx = await getTicketPurchaseContext(slug);
  return createPageMetadata({
    title: ctx ? `Ödeme — ${ctx.event.title}` : 'Ödeme',
    path: `/etkinlik/${slug}/bilet`,
    noIndex: true
  });
}

export default async function MultiSeatCheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { ids: idsRaw } = await searchParams;
  const ctx = await getTicketPurchaseContext(slug);
  if (!ctx) notFound();

  if (ctx.external && ctx.event.externalUrl) {
    redirect(ctx.event.externalUrl);
  }

  const ids = (idsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    redirect(`/etkinlik/${slug}/bilet`);
  }

  if (ids.length === 1) {
    redirect(`/etkinlik/${slug}/bilet/${ids[0]}/odeme?adet=1`);
  }

  const seatTicketTypes = ids.map((id) => {
    const tt = findTicketType(ctx.ticketTypes, id);
    if (!tt || !ticketTypeAvailable(tt)) return null;
    return tt;
  });

  if (seatTicketTypes.some((tt) => tt == null)) {
    redirect(`/etkinlik/${slug}/bilet`);
  }

  const seats = seatTicketTypes as NonNullable<(typeof seatTicketTypes)[number]>[];

  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get('bf-locale')?.value);
  const rulesDisplay = await getEventRulesDisplay(ctx.event.id, locale);

  return (
    <div className="bg-background pb-12">
      <PurchaseEventBar event={ctx.event} backHref={`/etkinlik/${slug}/bilet`} />
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <header className="mb-6 text-foreground">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Ödeme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seats.length} koltuk seçtiniz. Bilgilerinizi girin ve siparişinizi tamamlayın.
          </p>
        </header>
        <PurchaseCheckoutForm
          event={ctx.event}
          ticketType={seats[0]!}
          quantity={1}
          seatTicketTypes={seats}
          rulesDisplay={rulesDisplay}
        />
      </div>
    </div>
  );
}
