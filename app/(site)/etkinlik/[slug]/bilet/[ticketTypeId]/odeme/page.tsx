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
  params: Promise<{ slug: string; ticketTypeId: string }>;
  searchParams: Promise<{ adet?: string }>;
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

export default async function TicketCheckoutPage({ params, searchParams }: Props) {
  const { slug, ticketTypeId } = await params;
  const { adet } = await searchParams;
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

  const parsedQty = Number.parseInt(adet ?? '1', 10);
  const quantity = Number.isFinite(parsedQty)
    ? Math.min(Math.max(parsedQty, 1), 10)
    : 1;

  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get('bf-locale')?.value);
  const rulesDisplay = await getEventRulesDisplay(ctx.event.id, locale);

  return (
    <div className="min-h-screen bg-background pb-12">
      <PurchaseEventBar
        event={ctx.event}
        backHref={`/etkinlik/${slug}/bilet/${ticketTypeId}`}
      />
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <header className="mb-6 text-foreground">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Ödeme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bilgilerinizi girin ve siparişinizi tamamlayın.
          </p>
        </header>
        <PurchaseCheckoutForm
          event={ctx.event}
          ticketType={ticketType}
          quantity={quantity}
          rulesDisplay={rulesDisplay}
        />
      </div>
    </div>
  );
}
