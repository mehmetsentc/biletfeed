'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
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
import type { CheckoutTicketType } from '@/lib/tickets/purchase-context';
import { calculatePurchasePricing, formatTry } from '@/lib/tickets/purchase-pricing';
import { validateCheckoutAttendee } from '@/lib/validation/checkout-attendee';
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
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);

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
          couponCode: couponApplied ? couponCode.trim() : undefined
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
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error('Ödeme sayfası alınamadı');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5 lg:gap-8">
      <div className="space-y-6 lg:col-span-3">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="rounded-2xl border bg-card p-5 md:p-6">
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

        <section className="rounded-2xl border bg-card p-5 md:p-6">
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
            <p className="mt-2 text-sm text-emerald-600">
              Kupon uygulandı — {formatTry(couponDiscount)} indirim
            </p>
          )}
        </section>

        {requiresRulesAcceptance && hasStructuredRules && rulesDisplay && (
          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <EventRulesAcceptanceList
              data={rulesDisplay}
              accepted={rulesAccepted}
              onAcceptedChange={setRulesAccepted}
            />
          </section>
        )}

        {requiresRulesAcceptance && !hasStructuredRules && (
          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <h3 className="text-sm font-semibold">Etkinlik Kuralları</h3>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm text-muted-foreground">
              {ruleLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-[#FF8A00]">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
              />
              <span>Etkinlik kurallarını okudum ve kabul ediyorum.</span>
            </label>
          </section>
        )}

        <section className="rounded-2xl border bg-card p-5 md:p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-[#FF8A00]" />
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
                <Lock className="size-3.5 shrink-0 text-[#FF8A00]" />
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
          className="h-14 w-full rounded-xl bg-[#FF8A00] text-base font-bold text-white hover:bg-[#F57C00] lg:hidden"
        >
          {loading
            ? 'İşleniyor...'
            : isPaid
              ? 'Siparişi Tamamla'
              : 'Ücretsiz Bileti Al'}
        </Button>
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-[5.5rem] space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
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
            className="hidden h-12 w-full rounded-xl bg-[#FF8A00] font-bold text-white hover:bg-[#F57C00] lg:flex"
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
