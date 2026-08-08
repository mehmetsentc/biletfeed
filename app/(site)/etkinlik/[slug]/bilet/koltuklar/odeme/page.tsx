import { notFound, redirect } from 'next/navigation';
import { PurchaseEventBar } from '@/components/tickets/purchase/purchase-event-bar';
import { PurchaseCheckoutForm } from '@/components/tickets/purchase/purchase-checkout-form';
import { getTicketPurchaseContext } from '@/lib/tickets/purchase-context';
import {
  findTicketType,
  ticketTypeAvailable,
  type CheckoutTicketType
} from '@/lib/tickets/purchase-types';
import { matchTicketTypeToSeatUnit } from '@/lib/tickets/seat-packages';
import { getEventRulesDisplay } from '@/lib/services/event-rules-display';
import { resolveLocaleFromCookie } from '@/lib/event-rules/i18n';
import { createPageMetadata } from '@/lib/seo/metadata';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ids?: string; seats?: string }>;
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
  const { ids: idsRaw, seats: seatsRaw } = await searchParams;
  const ctx = await getTicketPurchaseContext(slug);
  if (!ctx) notFound();

  if (ctx.external && ctx.event.externalUrl) {
    redirect(ctx.event.externalUrl);
  }

  const seatUnitIds = (seatsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const ids = (idsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  type SeatLine = CheckoutTicketType & { seatUnitId?: string };

  let seats: SeatLine[] = [];

  if (seatUnitIds.length > 0) {
    const zones = ctx.seatPlan?.zones ?? [];
    const allUnits = zones.flatMap((z) =>
      z.units.map((u) => ({ unit: u, zone: z }))
    );
    const resolved: SeatLine[] = [];
    for (const seatId of seatUnitIds) {
      const found = allUnits.find(
        (x) => x.unit.id.toUpperCase() === seatId.toUpperCase()
      );
      if (!found) {
        redirect(`/etkinlik/${slug}/bilet`);
      }
      const tt = matchTicketTypeToSeatUnit(
        found.unit.id,
        found.unit.ticketTypeHint,
        ctx.ticketTypes
      );
      if (!tt || !ticketTypeAvailable(tt)) {
        redirect(`/etkinlik/${slug}/bilet`);
      }
      resolved.push({
        ...tt,
        seatUnitId: found.unit.id,
        name: `${tt.name} · ${found.unit.label}`
      });
    }
    seats = resolved;
  } else if (ids.length > 0) {
    if (ids.length === 1) {
      redirect(`/etkinlik/${slug}/bilet/${ids[0]}/odeme?adet=1`);
    }
    const mapped = ids.map((id) => {
      const tt = findTicketType(ctx.ticketTypes, id);
      if (!tt || !ticketTypeAvailable(tt)) return null;
      return tt;
    });
    if (mapped.some((tt) => tt == null)) {
      redirect(`/etkinlik/${slug}/bilet`);
    }
    seats = mapped as SeatLine[];
  } else {
    redirect(`/etkinlik/${slug}/bilet`);
  }

  if (seats.length === 1 && !seats[0]!.seatUnitId) {
    redirect(`/etkinlik/${slug}/bilet/${seats[0]!.id}/odeme?adet=1`);
  }

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
          seatUnitIds={seats.map((s) => s.seatUnitId).filter((id): id is string => Boolean(id))}
          rulesDisplay={rulesDisplay}
        />
      </div>
    </div>
  );
}
