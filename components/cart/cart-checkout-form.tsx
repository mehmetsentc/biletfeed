'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import { CheckoutBillingSection } from '@/components/checkout/checkout-billing-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/components/providers/cart-provider';
import {
  cartSubtotal,
  formatCartEventDate,
  groupCartLinesByEvent
} from '@/lib/cart/storage';
import { formatTry } from '@/lib/tickets/purchase-pricing';
import { validateCheckoutAttendee } from '@/lib/validation/checkout-attendee';
import {
  emptyCheckoutBilling,
  validateCheckoutBilling,
  type CheckoutBillingFormState,
  type CheckoutBillingInput
} from '@/lib/validation/checkout-billing';
import { sanitizePhoneInput } from '@/lib/validation/phone';

export function CartCheckoutForm() {
  const router = useRouter();
  const { lines, hydrated, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>(
    {}
  );
  const [billing, setBilling] = useState<CheckoutBillingFormState>(
    emptyCheckoutBilling
  );
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>(
    {}
  );

  const groups = useMemo(() => groupCartLinesByEvent(lines), [lines]);
  const total = useMemo(() => cartSubtotal(lines), [lines]);
  const isPaid = total > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const attendee = validateCheckoutAttendee({
      attendeeName,
      attendeeEmail,
      attendeePhone
    });
    if (!attendee.success) {
      setAttendeeErrors(attendee.errors);
      setError('Katılımcı bilgilerini kontrol edin');
      return;
    }
    setAttendeeErrors({});

    let billingPayload: CheckoutBillingInput | undefined;
    if (isPaid) {
      const billingResult = validateCheckoutBilling(billing);
      if (!billingResult.success) {
        setBillingErrors(billingResult.errors);
        setError('Fatura bilgilerini kontrol edin');
        return;
      }
      billingPayload = billingResult.data;
      setBillingErrors({});
    }

    setLoading(true);
    try {
      const items = lines.map((line) => {
        if (line.seatUnitIds && line.seatUnitIds.length > 0) {
          return {
            eventSlug: line.eventSlug,
            quantity: line.seatUnitIds.length,
            ticketTypeIds: line.seatUnitIds.map(() => line.ticketTypeId),
            seatUnitIds: line.seatUnitIds
          };
        }
        return {
          eventSlug: line.eventSlug,
          quantity: line.quantity,
          ticketTypeId: line.ticketTypeId
        };
      });

      const res = await fetch('/api/orders/cart-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          attendeeName: attendee.data.attendeeName,
          attendeeEmail: attendee.data.attendeeEmail,
          attendeePhone: attendee.data.attendeePhone,
          ...(billingPayload ? { billing: billingPayload } : {})
        })
      });
      const data = (await res.json()) as {
        error?: string;
        status?: string;
        orderId?: string;
        redirectUrl?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Ödeme başlatılamadı');
      }

      clear();

      if (data.status === 'paid' && data.orderId) {
        router.push(`/odeme/basarili?order=${data.orderId}`);
        return;
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      throw new Error('Ödeme yönlendirmesi alınamadı');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (lines.length === 0) {
    router.replace('/sepet');
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
        <h1 className="text-xl font-extrabold">Sepet Ödemesi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Farklı günlerdeki etkinlikler tek ödemede tamamlanır.
        </p>
        <ul className="mt-4 space-y-3">
          {groups.map((group) => (
            <li key={group.eventId} className="rounded-xl bg-muted/40 p-3">
              <p className="font-semibold">{group.eventTitle}</p>
              <p className="text-xs text-muted-foreground">
                {formatCartEventDate(group.eventStartAt)}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {group.lines.map((line) => {
                  const qty =
                    line.seatUnitIds?.length && line.seatUnitIds.length > 0
                      ? line.seatUnitIds.length
                      : line.quantity;
                  return (
                    <li
                      key={line.key}
                      className="flex justify-between gap-2 tabular-nums"
                    >
                      <span className="truncate">
                        {line.ticketTypeName} × {qty}
                      </span>
                      <span className="font-medium">
                        {formatTry(
                          line.unitPrice *
                            (line.isBogo ? Math.ceil(qty / 2) : qty)
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold">Toplam</span>
          <span className="text-xl font-extrabold tabular-nums">
            {formatTry(total)}
          </span>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground">
        <h2 className="font-bold">Katılımcı Bilgileri</h2>
        <div className="space-y-2">
          <Label htmlFor="cart-name">Ad Soyad</Label>
          <Input
            id="cart-name"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            autoComplete="name"
          />
          {attendeeErrors.attendeeName ? (
            <p className="text-xs text-destructive">
              {attendeeErrors.attendeeName}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cart-email">E-posta</Label>
          <Input
            id="cart-email"
            type="email"
            value={attendeeEmail}
            onChange={(e) => setAttendeeEmail(e.target.value)}
            autoComplete="email"
          />
          {attendeeErrors.attendeeEmail ? (
            <p className="text-xs text-destructive">
              {attendeeErrors.attendeeEmail}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cart-phone">Telefon</Label>
          <Input
            id="cart-phone"
            value={attendeePhone}
            onChange={(e) => setAttendeePhone(sanitizePhoneInput(e.target.value))}
            autoComplete="tel"
          />
          {attendeeErrors.attendeePhone ? (
            <p className="text-xs text-destructive">
              {attendeeErrors.attendeePhone}
            </p>
          ) : null}
        </div>
      </section>

      {isPaid ? (
        <CheckoutBillingSection
          value={billing}
          onChange={setBilling}
          errors={billingErrors}
          onClearError={(field) =>
            setBillingErrors((prev) => ({ ...prev, [field]: '' }))
          }
          suggestedName={attendeeName}
        />
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="h-14 w-full rounded-xl text-base font-bold"
      >
        {loading
          ? 'İşleniyor…'
          : isPaid
            ? `Ödemeyi Tamamla · ${formatTry(total)}`
            : 'Biletleri Al'}
      </Button>

      <p className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3.5" aria-hidden /> SSL
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="size-3.5" aria-hidden /> 3D Secure
        </span>
      </p>
    </form>
  );
}
