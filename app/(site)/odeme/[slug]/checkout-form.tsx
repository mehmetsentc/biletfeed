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
    return price <= 0 ? 'Ücretsiz' : `${price.toLocaleString('tr-TR')} ₺`;
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
      if (!res.ok) throw new Error(data.error || 'Geçersiz kupon');
      setCouponDiscount(data.discount);
      setCouponApplied(true);
    } catch (e) {
      setCouponApplied(false);
      setCouponDiscount(0);
      setCouponError(e instanceof Error ? e.message : 'Kupon uygulanamadı');
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
      setError('Lütfen katılımcı bilgilerini eksiksiz doldurun.');
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
          ticketTypeId: selectedType?.id,
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
        router.push(`/odeme/basarili?order=${data.orderId}`);
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
                  <BfSubStepLabel label="Adım 1" />
                  <h2 className="mt-1 text-lg font-bold">Bilet türünü seçin</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Size uygun bilet kategorisini seçerek devam edin.
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
                                Son {left} bilet
                              </p>
                            )}
                            {left === 0 && (
                              <p className="mt-0.5 text-xs font-medium text-destructive">
                                Tükendi
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
                      ← Bilet türünü değiştir
                    </button>
                  )}
                  <BfSubStepLabel label="Adım 1" />
                  <h2 className="mt-1 text-lg font-bold">{selectedType?.name ?? 'Genel Giriş'}</h2>
                </div>

                <div className="px-6 py-8">
                  <p className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Adet seçin
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
                      label="Bilet fiyatı"
                      value={
                        subtotal === 0
                          ? 'Ücretsiz'
                          : `${subtotal.toLocaleString('tr-TR')} ₺`
                      }
                    />
                    <Separator />
                    <BfPriceRow
                      label="Toplam"
                      value={
                        subtotal === 0
                          ? 'Ücretsiz'
                          : `${subtotal.toLocaleString('tr-TR')} ₺`
                      }
                      highlight
                    />
                  </div>

                  {requiresRulesAcceptance && hasStructuredRules && rulesDisplay && (
                    <div className="mt-6">
                      <EventRulesAcceptanceList
                        data={rulesDisplay}
                        accepted={rulesAccepted}
                        onAcceptedChange={setRulesAccepted}
                      />
                    </div>
                  )}
                  {requiresRulesAcceptance && !hasStructuredRules && (
                    <div className="mt-6 space-y-3 rounded-xl border border-border bg-muted p-4">
                      <h3 className="text-sm font-semibold">Etkinlik kuralları</h3>
                      <ul className="max-h-36 space-y-1.5 overflow-y-auto text-sm text-muted-foreground">
                        {ruleLines.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="text-primary">•</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                      <label className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 accent-primary"
                          checked={rulesAccepted}
                          onChange={(e) => setRulesAccepted(e.target.checked)}
                        />
                        Kuralları okudum ve kabul ediyorum.
                      </label>
                    </div>
                  )}

                  <Button
                    className="mt-8 h-13 w-full rounded-xl text-base font-bold"
                    size="lg"
                    disabled={requiresRulesAcceptance && !rulesAccepted}
                    onClick={() => setStep(2)}
                  >
                    Devam Et
                  </Button>
                </div>
              </section>
            )}

            {/* ——— Adım 2: Katılımcı ——— */}
            {step === 2 && (
              <section className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="border-b border-border px-6 py-5">
                  <BfSubStepLabel label="Adım 2" />
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                    <User className="size-5 text-primary" />
                    Katılımcı bilgileri
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bilet bu bilgilerle oluşturulur; girişte kimlik kontrolü yapılabilir.
                  </p>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="attendeeName">
                      Ad Soyad <span className="text-destructive">*</span>
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
                      placeholder="Bilet sahibi adı"
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
                      Telefon <span className="text-destructive">*</span>
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
                      E-posta <span className="text-destructive">*</span>
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
                      İndirim kodu (isteğe bağlı)
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponApplied(false);
                          setCouponDiscount(0);
                        }}
                        placeholder="KUPONKODU"
                        className="h-10 rounded-lg uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-lg"
                        onClick={() => void applyCoupon()}
                      >
                        Uygula
                      </Button>
                    </div>
                    {couponError && (
                      <p className="mt-2 text-sm text-destructive">{couponError}</p>
                    )}
                    {couponApplied && (
                      <p className="mt-2 text-sm font-medium text-[var(--bf-success)]">
                        Kupon uygulandı — {couponDiscount.toLocaleString('tr-TR')} ₺ indirim
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStep(1)}
                    >
                      Geri
                    </Button>
                    <Button
                      className="h-12 flex-1 rounded-xl text-base font-bold"
                      onClick={() => {
                        if (validateParticipantStep()) setStep(3);
                      }}
                    >
                      Ödemeye Geç
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
                  <BfSubStepLabel label="Adım 3" />
                  <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                    <ShieldCheck className="size-5 text-primary" />
                    {isPaid ? 'Güvenli ödeme' : 'Sipariş onayı'}
                  </h2>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="rounded-xl bg-muted p-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Etkinlik</span>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarih</span>
                        <span>{formatEventDate(event.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Katılımcı</span>
                        <span>{attendeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bilet</span>
                        <span>
                          {selectedType?.name ?? 'Genel'} × {quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="space-y-3 rounded-xl border border-primary/20 bg-accent/50 p-4 text-sm">
                      <p>
                        Kart bilgileriniz BiletFeed sunucularında{' '}
                        <strong>saklanmaz</strong>. Ödeme banka sanal POS altyapısı ile
                        tamamlanır.
                      </p>
                      <PaymentCardLogos />
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="size-3.5 shrink-0 text-primary" />
                        SSL · 3D Secure
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <ExternalLink className="size-3.5 shrink-0" />
                        Devam ettiğinizde ödeme sayfasına yönlendirilirsiniz
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ücretsiz etkinlik — onayladığınızda QR biletiniz anında oluşturulur.
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setStep(2)}
                    >
                      Geri
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 flex-1 rounded-xl text-base font-bold"
                    >
                      {loading
                        ? 'Yönlendiriliyor…'
                        : isPaid
                          ? `Siparişi Tamamla · ${total.toLocaleString('tr-TR')} ₺`
                          : 'Ücretsiz Bileti Al'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            <BfOrderSummary
              event={event}
              ticketTypeName={selectedType?.name ?? 'Genel Giriş'}
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
