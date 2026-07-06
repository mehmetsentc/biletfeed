'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ExternalLink, Lock, ShieldCheck, CreditCard } from 'lucide-react';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { CheckoutBillingSection } from '@/components/checkout/checkout-billing-section';
import { PurchasePriceBreakdown } from '@/components/tickets/purchase/purchase-price-breakdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EventRulesAcceptanceList } from '@/components/events/event-rules-display';
import type { EventRulesDisplayData } from '@/lib/event-rules/types';
import {
  formatEventDate,
  type MockEvent
} from '@/lib/data/mock-events';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import { calculatePurchasePricing, formatTry } from '@/lib/tickets/purchase-pricing';
import { validateCheckoutAttendee } from '@/lib/validation/checkout-attendee';
import {
  emptyCheckoutBilling,
  validateCheckoutBilling,
  type CheckoutBillingFormState,
  type CheckoutBillingInput
} from '@/lib/validation/checkout-billing';
import { normalizeTrPhone } from '@/lib/validation/tr-phone';

interface PurchaseCheckoutFormProps {
  event: MockEvent;
  ticketType: CheckoutTicketType;
  quantity: number;
  rulesDisplay?: EventRulesDisplayData | null;
}

export function PurchaseCheckoutForm({
  event,
  ticketType,
  quantity,
  rulesDisplay
}: PurchaseCheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
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

  const pricing = calculatePurchasePricing({
    unitPrice: ticketType.price,
    quantity,
    discount: couponDiscount
  });
  const isPaid = pricing.total > 0;

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
          ticketTypeId: ticketType.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Geçersiz kupon');
      setCouponDiscount(data.discount);
      setCouponApplied(true);
    } catch (e) {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponError(e instanceof Error ? e.message : 'Kupon uygulanamadı');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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
      setError('Lütfen katılımcı bilgilerini eksiksiz doldurun.');
      setLoading(false);
      return;
    }

    if (requiresRulesAcceptance && !rulesAccepted) {
      setError('Devam etmek için etkinlik kurallarını kabul etmelisiniz.');
      setLoading(false);
      return;
    }

    let billingPayload: CheckoutBillingInput | undefined;
    if (isPaid) {
      const billingResult = validateCheckoutBilling(billing);
      if (!billingResult.success) {
        setBillingErrors(billingResult.errors);
        setError('Lütfen fatura bilgilerini kontrol edin.');
        setLoading(false);
        return;
      }
      billingPayload = billingResult.data;
      setBillingErrors({});
    }

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: event.slug,
          quantity,
          ticketTypeId: ticketType.id,
          attendeeName: attendee.data.attendeeName,
          attendeeEmail: attendee.data.attendeeEmail,
          attendeePhone: attendee.data.attendeePhone,
          couponCode: couponApplied ? couponCode.trim() : undefined,
          ...(billingPayload ? { billing: billingPayload } : {})
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sipariş oluşturulamadı');
      }

      if (data.status === 'paid') {
        router.push(
          `/etkinlik/${event.slug}/bilet/basarili?order=${data.orderId}`
        );
        return;
      }

      if (data.redirectUrl) {
        // Tosla sayfasını iframe modal içinde göster (full redirect yerine)
        setPaymentUrl(data.redirectUrl);
        setLoading(false);
        return;
      }

      throw new Error('Ödeme sayfası alınamadı');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  }

  // Yönlendirme overlay'i — Tosla sayfasına geçmeden önce BiletFeed markalı ekran
  if (paymentUrl) {
    // 1.8 saniye sonra Tosla'ya yönlendir
    if (typeof window !== 'undefined') {
      setTimeout(() => { window.location.href = paymentUrl; }, 1800);
    }
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
        {/* Spinner */}
        <div className="mb-8 flex size-20 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="size-9 text-primary" />
        </div>

        <h2 className="text-xl font-bold text-foreground">Güvenli ödeme sayfasına yönlendiriliyorsunuz</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Lütfen bekleyin, banka sanal POS altyapısına bağlanıyoruz…
        </p>

        {/* Animasyonlu çubuk */}
        <div className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ animation: 'progress 1.8s linear forwards' }}
          />
        </div>

        <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-primary" />
          256-bit SSL şifrelemeli güvenli bağlantı
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5 lg:gap-8">
      <div className="space-y-6 lg:col-span-3">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
          <h1 className="text-lg font-bold">Katılımcı Bilgileri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bilet sahibi bilgileri giriş kapısında gösterilir.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              id="attendeeName"
              label="Ad Soyad"
              value={attendeeName}
              onChange={(v) => {
                setAttendeeName(v);
                if (attendeeErrors.attendeeName) {
                  setAttendeeErrors((prev) => ({ ...prev, attendeeName: '' }));
                }
              }}
              placeholder="Bilet sahibi adı"
              autoComplete="name"
              error={attendeeErrors.attendeeName}
              required
            />
            <Field
              id="attendeePhone"
              label="Telefon"
              value={attendeePhone}
              onChange={(v) => {
                setAttendeePhone(normalizeTrPhone(v));
                if (attendeeErrors.attendeePhone) {
                  setAttendeeErrors((prev) => ({ ...prev, attendeePhone: '' }));
                }
              }}
              placeholder="05XX XXX XX XX"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              error={attendeeErrors.attendeePhone}
              required
            />
            <Field
              id="attendeeEmail"
              label="E-posta"
              value={attendeeEmail}
              onChange={(v) => {
                setAttendeeEmail(v);
                if (attendeeErrors.attendeeEmail) {
                  setAttendeeErrors((prev) => ({ ...prev, attendeeEmail: '' }));
                }
              }}
              placeholder="bilet@ornek.com"
              type="email"
              autoComplete="email"
              error={attendeeErrors.attendeeEmail}
              required
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
          <h2 className="font-semibold">Kupon Kodu</h2>
          <div className="mt-3 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponApplied(false);
                setCouponDiscount(0);
              }}
              placeholder="Varsa kupon kodunuz"
            />
            <Button type="button" variant="outline" onClick={() => void applyCoupon()}>
              Uygula
            </Button>
          </div>
          {couponError && (
            <p className="mt-2 text-sm text-destructive">{couponError}</p>
          )}
          {couponApplied && (
            <p className="mt-2 text-sm text-[var(--bf-success)]">
              Kupon uygulandı — {formatTry(couponDiscount)} indirim
            </p>
          )}
        </section>

        {isPaid && (
          <CheckoutBillingSection
            value={billing}
            onChange={setBilling}
            errors={billingErrors}
            onClearError={(field) =>
              setBillingErrors((prev) => ({ ...prev, [field]: '' }))
            }
            suggestedName={attendeeName}
          />
        )}

        {requiresRulesAcceptance && (
          <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
            <EventRulesAcceptanceList
              data={hasStructuredRules ? rulesDisplay ?? undefined : undefined}
              plainLines={hasStructuredRules ? undefined : ruleLines}
              eventTitle={event.title}
              accepted={rulesAccepted}
              onAcceptedChange={setRulesAccepted}
            />
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-primary" />
            {isPaid ? 'Güvenli Ödeme' : 'Onay'}
          </h2>
          {isPaid ? (
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Kart bilgileriniz BiletFeed sunucularında{' '}
                <strong className="text-foreground">saklanmaz</strong>. Ödeme banka
                sanal POS altyapısı ile tamamlanır.
              </p>
              <PaymentCardLogos />
              <p className="flex items-center gap-2">
                <Lock className="size-3.5 shrink-0 text-primary" />
                SSL ile güvenli bağlantı
              </p>
              <p className="flex items-center gap-2">
                <ExternalLink className="size-3.5 shrink-0" />
                Devam ettiğinizde ödeme sayfasına yönlendirilirsiniz
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Ücretsiz etkinlik — onayladığınızda QR biletiniz oluşturulur.
            </p>
          )}
        </section>

        <Button
          type="submit"
          size="lg"
          disabled={loading || (requiresRulesAcceptance && !rulesAccepted)}
          className="h-14 w-full rounded-xl text-base font-bold lg:hidden"
        >
          {loading
            ? 'İşleniyor...'
            : isPaid
              ? 'Siparişi Tamamla'
              : 'Ücretsiz Bileti Al'}
        </Button>
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-[5.5rem] space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
          <div className="relative mb-1 aspect-video overflow-hidden rounded-xl bg-muted">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold leading-snug">{event.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatEventDate(event.startDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.venue}, {event.city}
            </p>
          </div>
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bilet türü</span>
              <span className="font-medium">{ticketType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adet</span>
              <span className="font-medium">{quantity}</span>
            </div>
          </div>
          <Separator />
          <PurchasePriceBreakdown
            unitPrice={ticketType.price}
            quantity={quantity}
            discount={couponDiscount}
            compact
          />
          <Button
            type="submit"
            size="lg"
            disabled={loading || (requiresRulesAcceptance && !rulesAccepted)}
            className="hidden h-12 w-full rounded-xl font-bold lg:flex"
          >
            {loading
              ? 'İşleniyor...'
              : isPaid
                ? 'Siparişi Tamamla'
                : 'Ücretsiz Bileti Al'}
          </Button>
          {isPaid && (
            <>
              <Separator />
              <PaymentCardLogos className="justify-center" logoClassName="h-5 w-auto" />
            </>
          )}
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoComplete,
  maxLength,
  error,
  required
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
