'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ExternalLink,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  User
} from 'lucide-react';
import { BfCheckoutContextBar } from '@/components/checkout/bf-checkout-context-bar';
import { BfCheckoutSteps, BfSubStepLabel } from '@/components/checkout/bf-checkout-steps';
import { BfOrderSummary, BfPriceRow } from '@/components/checkout/bf-order-summary';
import { CheckoutBillingSection } from '@/components/checkout/checkout-billing-section';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EventRulesAcceptanceList } from '@/components/events/event-rules-display';
import {
  type MockEvent,
  formatEventDate
} from '@/lib/data/mock-events';
import type { EventRulesDisplayData } from '@/lib/event-rules/types';
import { validateCheckoutAttendee } from '@/lib/validation/checkout-attendee';
import {
  emptyCheckoutBilling,
  validateCheckoutBilling,
  type CheckoutBillingFormState
} from '@/lib/validation/checkout-billing';
import { useTranslations } from '@/components/providers';
import { normalizeTrPhone } from '@/lib/validation/tr-phone';

type TicketTypeRow = {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  showLowStockBadge: boolean;
};

export function CheckoutForm({
  event,
  ticketTypes,
  rulesDisplay
}: {
  event: MockEvent;
  ticketTypes: TicketTypeRow[];
  rulesDisplay?: EventRulesDisplayData | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tierPhase, setTierPhase] = useState<'pick' | 'qty'>(
    ticketTypes.length <= 1 ? 'qty' : 'pick'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState(ticketTypes[0]?.id ?? '');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [billing, setBilling] = useState<CheckoutBillingFormState>(emptyCheckoutBilling);
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});

  const eventRules = event.rules?.trim() ?? '';
  const ruleLines = eventRules
    ? eventRules
        .split(/\r?\n/)
        .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
        .filter(Boolean)
    : [];
  const hasStructuredRules =
    rulesDisplay != null &&
    (rulesDisplay.sections.length > 0 || rulesDisplay.announcements.length > 0);
  const requiresRulesAcceptance = hasStructuredRules || ruleLines.length > 0;

  const selectedType =
    ticketTypes.find((t) => t.id === selectedTypeId) ?? ticketTypes[0];
  const unitPrice = selectedType?.price ?? event.price;
  const subtotal = event.isFree ? 0 : unitPrice * quantity;
  const total = Math.max(0, subtotal - couponDiscount);
  const isPaid = total > 0;
  const remaining = selectedType
    ? Math.max(0, selectedType.capacity - selectedType.sold)
    : 10;

  function priceLabel(price: number): string {
    return price <= 0 ? t.common.free : `${price.toLocaleString('tr-TR')} ₺`;
  }

  function selectTier(id: string) {
    setSelectedTypeId(id);
    setTierPhase('qty');
    setQuantity(1);
  }

  function validateParticipantStep(): boolean {
    const result = validateCheckoutAttendee({
      attendeeName,
      attendeeEmail,
      attendeePhone
    });
    if (!result.success) {
      setAttendeeErrors(result.errors);
      return false;
    }
    setAttendeeErrors({});
    return true;
  }

  async function applyCoupon() {
    setCouponError(null);
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          eventSlug: event.slug,
          quantity,
          ticketTypeId: selectedType?.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.purchase.invalidCoupon);
      setCouponDiscount(data.discount);
      setCouponApplied(true);
    } catch (e) {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponError(e instanceof Error ? e.message : t.purchase.couponApplyFailed);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const attendee = validateCheckoutAttendee({
      attendeeName,
      attendeeEmail,
      attendeePhone
    });
    if (!attendee.success) {
      setAttendeeErrors(attendee.errors);
      setStep(2);
      setError(t.purchase.fillParticipants);
      setLoading(false);
      return;
    }

    if (isPaid) {
      const billingResult = validateCheckoutBilling(billing);
      if (!billingResult.success) {
        setBillingErrors(billingResult.errors);
        setStep(3);
        setError(t.purchase.checkBilling);
        setLoading(false);
        return;
      }
      setBillingErrors({});

      try {
        const res = await fetch('/api/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventSlug: event.slug,
            quantity,
            ticketTypeId: selectedType?.id,
            attendeeName: attendee.data.attendeeName,
            attendeeEmail: attendee.data.attendeeEmail,
            attendeePhone: attendee.data.attendeePhone,
            couponCode: couponApplied ? couponCode.trim() : undefined,
            billing: billingResult.data
          })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t.purchase.orderCreateFailed);
        }

        if (data.status === 'paid') {
          router.push(`/odeme/basarili?order=${data.orderId}`);
          return;
        }

        if (data.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }

        throw new Error(t.purchase.paymentPageFailed);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.purchase.transactionFailed);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: event.slug,
          quantity,
          ticketTypeId: selectedType?.id,
          attendeeName: attendee.data.attendeeName,
          attendeeEmail: attendee.data.attendeeEmail,
          attendeePhone: attendee.data.attendeePhone,
          couponCode: couponApplied ? couponCode.trim() : undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.purchase.orderCreateFailed);
      }

      if (data.status === 'paid') {
        router.push(`/odeme/basarili?order=${data.orderId}`);
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error(t.purchase.paymentPageFailed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.purchase.transactionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <BfCheckoutContextBar event={event} />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <BfCheckoutSteps current={step} className="mb-8 max-w-md mx-auto" />

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            {/* ——— Adım 1: Bilet seçimi ——— */}
            {step === 1 && tierPhase === 'pick' && (
              <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="border-b border-border px-6 py-5">
                  <BfSubStepLabel label={t.purchase.stepOf(1, 3)} />
                  <h2 className="mt-1 text-lg font-bold">{t.purchase.selectTicketType}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.purchase.selectTicketTypeHint}
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {ticketTypes.map((type) => {
                    const left = type.capacity - type.sold;
                    return (
                      <li key={type.id}>
                        <button
                          type="button"
                          onClick={() => selectTier(type.id)}
                          className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-accent/50"
                        >
                          <div className="h-12 w-1 shrink-0 rounded-full bg-primary opacity-80 group-hover:opacity-100" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{type.name}</p>
                            {type.showLowStockBadge && left > 0 && (
                              <p className="mt-0.5 text-xs font-medium text-primary">
                                {t.events.lastTickets(left)}
                              </p>
                            )}
                            {left === 0 && (
                              <p className="mt-0.5 text-xs font-medium text-destructive">
                                {t.events.soldOut}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-lg font-extrabold text-primary">
                              {priceLabel(type.price)}
                            </span>
                            <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-primary" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {step === 1 && tierPhase === 'qty' && (
              <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="border-b border-border px-6 py-5">
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTierPhase('pick')}
                      className="mb-2 text-xs font-medium text-primary hover:underline"
                    >
                      {t.purchase.changeTicketType}
                    </button>
                  )}
                  <BfSubStepLabel label={t.purchase.stepOf(1, 3)} />
                  <h2 className="mt-1 text-lg font-bold">{selectedType?.name ?? t.purchase.generalAdmission}</h2>
                </div>

                <div className="px-6 py-8">
                  <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.purchase.quantitySelect}
                  </p>
                  <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-12 rounded-full border-2"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="size-5" />
                    </Button>
                    <span className="min-w-[3rem] text-center text-3xl font-extrabold tabular-nums">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-12 rounded-full border-2"
                      disabled={quantity >= Math.min(10, remaining)}
                      onClick={() => setQuantity((q) => Math.min(10, remaining, q + 1))}
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  <div className="mx-auto mt-8 max-w-sm rounded-xl bg-muted px-5 py-4">
                    <BfPriceRow
                      label={t.purchase.ticketPrice}
                      value={
                        subtotal === 0
                          ? t.common.free
                          : `${subtotal.toLocaleString('tr-TR')} ₺`
                      }
                    />
                    <Separator />
                    <BfPriceRow
                      label={t.purchase.total}
                      value={
                        subtotal === 0
                          ? t.common.free
                          : `${subtotal.toLocaleString('tr-TR')} ₺`
                      }
                      highlight
                    />
                  </div>

                  {requiresRulesAcceptance && (
                    <div className="mt-6">
                      <EventRulesAcceptanceList
                        data={hasStructuredRules ? rulesDisplay ?? undefined : undefined}
                        plainLines={hasStructuredRules ? undefined : ruleLines}
                        eventTitle={event.title}
                        accepted={rulesAccepted}
                        onAcceptedChange={setRulesAccepted}
                      />
                    </div>
                  )}

                  <Button
                    className="mt-8 h-13 w-full rounded-xl text-base font-bold"
                    size="lg"
                    disabled={requiresRulesAcceptance && !rulesAccepted}
                    onClick={() => setStep(2)}
                  >
                    {t.purchase.continue}
                  </Button>
                </div>
              </section>
            )}

            {/* ——— Adım 2: Katılımcı ——— */}
            {step === 2 && (
              <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="border-b border-border px-6 py-5">
                  <BfSubStepLabel label={t.purchase.stepOf(2, 3)} />
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                    <User className="size-5 text-primary" />
                    {t.purchase.participantInfo}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.purchase.participantHint}
                  </p>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="attendeeName">
                      {t.auth.displayName} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="attendeeName"
                      value={attendeeName}
                      onChange={(e) => {
                        setAttendeeName(e.target.value);
                        if (attendeeErrors.attendeeName) {
                          setAttendeeErrors((p) => ({ ...p, attendeeName: '' }));
                        }
                      }}
                      placeholder={t.purchase.ticketHolderPlaceholder}
                      autoComplete="name"
                      aria-invalid={Boolean(attendeeErrors.attendeeName)}
                      className="h-11 rounded-xl"
                    />
                    {attendeeErrors.attendeeName && (
                      <p className="text-sm text-destructive">{attendeeErrors.attendeeName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendeePhone">
                      {t.purchase.phone} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="attendeePhone"
                      type="tel"
                      inputMode="tel"
                      value={attendeePhone}
                      onChange={(e) => {
                        setAttendeePhone(normalizeTrPhone(e.target.value));
                        if (attendeeErrors.attendeePhone) {
                          setAttendeeErrors((p) => ({ ...p, attendeePhone: '' }));
                        }
                      }}
                      placeholder="05XX XXX XX XX"
                      maxLength={15}
                      autoComplete="tel"
                      className="h-11 rounded-xl"
                    />
                    {attendeeErrors.attendeePhone && (
                      <p className="text-sm text-destructive">{attendeeErrors.attendeePhone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendeeEmail">
                      {t.auth.email} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="attendeeEmail"
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => {
                        setAttendeeEmail(e.target.value);
                        if (attendeeErrors.attendeeEmail) {
                          setAttendeeErrors((p) => ({ ...p, attendeeEmail: '' }));
                        }
                      }}
                      placeholder="bilet@ornek.com"
                      autoComplete="email"
                      className="h-11 rounded-xl"
                    />
                    {attendeeErrors.attendeeEmail && (
                      <p className="text-sm text-destructive">{attendeeErrors.attendeeEmail}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/80 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Tag className="size-4 text-primary" />
                      {t.purchase.couponOptional}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponApplied(false);
                          setCouponDiscount(0);
                        }}
                        placeholder={t.purchase.couponPlaceholder}
                        className="h-10 rounded-lg uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-lg"
                        onClick={() => void applyCoupon()}
                      >
                        {t.purchase.apply}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="mt-2 text-sm text-destructive">{couponError}</p>
                    )}
                    {couponApplied && (
                      <p className="mt-2 text-sm font-medium text-[var(--bf-success)]">
                        {t.purchase.couponApplied(`${couponDiscount.toLocaleString('tr-TR')} ₺`)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStep(1)}
                    >
                      {t.common.back}
                    </Button>
                    <Button
                      className="h-12 flex-1 rounded-xl text-base font-bold"
                      onClick={() => {
                        if (validateParticipantStep()) setStep(3);
                      }}
                    >
                      {t.purchase.checkout}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* ——— Adım 3: Ödeme ——— */}
            {step === 3 && (
              <form
                onSubmit={handleCheckout}
                className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
              >
                <div className="border-b border-border px-6 py-5">
                  <BfSubStepLabel label={t.purchase.stepOf(3, 3)} />
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                    <ShieldCheck className="size-5 text-primary" />
                    {isPaid ? t.purchase.securePayment : t.purchase.orderConfirm}
                  </h2>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="rounded-xl bg-muted p-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.purchase.eventLabel}</span>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.events.date}</span>
                        <span>{formatEventDate(event.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.tickets.participant}</span>
                        <span>{attendeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.tickets.ticketType}</span>
                        <span>
                          {selectedType?.name ?? t.purchase.generalShort} × {quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPaid && (
                    <CheckoutBillingSection
                      value={billing}
                      onChange={setBilling}
                      errors={billingErrors}
                      onClearError={(field) =>
                        setBillingErrors((prev) => ({ ...prev, [field]: '' }))
                      }
                      suggestedName={attendeeName}
                      className="rounded-xl border border-border bg-muted/30 p-4"
                    />
                  )}

                  {isPaid ? (
                    <div className="space-y-3 rounded-xl border border-primary/20 bg-accent/50 p-4 text-sm">
                      <p>
                        {t.purchase.paymentNotStoredPrefix}{' '}
                        <strong>{t.purchase.notStoredEmphasis}</strong>.{' '}
                        {t.purchase.paymentNotStoredSuffix}
                      </p>
                      <PaymentCardLogos />
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="size-3.5 shrink-0 text-primary" />
                        {t.purchase.paymentSsl}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <ExternalLink className="size-3.5 shrink-0" />
                        {t.purchase.paymentRedirect}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t.purchase.freeEventConfirm}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStep(2)}
                    >
                      {t.common.back}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 flex-1 rounded-xl text-base font-bold"
                    >
                      {loading
                        ? t.purchase.redirecting
                        : isPaid
                          ? t.purchase.completeOrderAmount(`${total.toLocaleString('tr-TR')} ₺`)
                          : t.purchase.getFreeTicket}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            <BfOrderSummary
              event={event}
              ticketTypeName={selectedType?.name ?? t.purchase.generalAdmission}
              quantity={quantity}
              unitPrice={unitPrice}
              discount={couponDiscount}
              className="sticky top-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
