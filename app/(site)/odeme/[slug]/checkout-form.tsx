'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ExternalLink, Lock, ShieldCheck, User } from 'lucide-react';
import { StepIndicator } from '@/components/checkout/step-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  type MockEvent,
  formatEventDate,
  formatPrice
} from '@/lib/data/mock-events';

export function CheckoutForm({
  event,
  ticketTypes
}: {
  event: MockEvent;
  ticketTypes: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    currency: string;
    capacity: number;
    sold: number;
  }>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState(ticketTypes[0]?.id ?? '');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const selectedType =
    ticketTypes.find((t) => t.id === selectedTypeId) ?? ticketTypes[0];
  const unitPrice = selectedType?.price ?? event.price;
  const subtotal = event.isFree ? 0 : unitPrice * quantity;
  const total = Math.max(0, subtotal - couponDiscount);
  const isPaid = total > 0;

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

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: event.slug,
          quantity,
          ticketTypeId: selectedType?.id,
          attendeeName: attendeeName.trim() || undefined,
          attendeeEmail: attendeeEmail.trim() || undefined,
          couponCode: couponApplied ? couponCode.trim() : undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/giris?redirect=/odeme/${event.slug}`);
          return;
        }
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
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Bilet Satın Al</h1>
      <p className="mt-1 text-muted-foreground">{event.title}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {error && (
          <div className="lg:col-span-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="lg:col-span-3 space-y-6">
          <StepIndicator
            current={step}
            labels={['Bilet', 'Katılımcı', 'Kupon', 'Özet', 'Ödeme']}
          />

          {step === 1 && (
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">1. Bilet Seçimi</h2>
              <div className="space-y-2">
                <Label>Bilet türü</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2"
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                >
                  {ticketTypes.length === 0 && (
                    <option value="">Genel Giriş — {formatPrice(event)}</option>
                  )}
                  {ticketTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} — {type.price <= 0 ? 'Ücretsiz' : `${type.price} ₺`} (
                      {Math.max(0, type.capacity - type.sold)} kaldı)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Devam Et
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <User className="size-5" />
                2. Katılımcı Bilgileri
              </h2>
              <p className="text-sm text-muted-foreground">
                Bilet sahibi bilgileri giriş kapısında gösterilir.
              </p>
              <div className="space-y-2">
                <Label htmlFor="attendeeName">Ad Soyad</Label>
                <Input
                  id="attendeeName"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="Bilet sahibi adı"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendeeEmail">E-posta</Label>
                <Input
                  id="attendeeEmail"
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="bilet@ornek.com"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Geri
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Devam Et
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">3. Kupon (isteğe bağlı)</h2>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponApplied(false);
                    setCouponDiscount(0);
                  }}
                  placeholder="Kupon kodu"
                />
                <Button type="button" variant="outline" onClick={() => void applyCoupon()}>
                  Uygula
                </Button>
              </div>
              {couponError && (
                <p className="text-sm text-destructive">{couponError}</p>
              )}
              {couponApplied && (
                <p className="text-sm text-emerald-600">
                  Kupon uygulandı — {couponDiscount} ₺ indirim
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Geri
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Devam Et
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">4. Sipariş Özeti</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Etkinlik</span>
                  <span>{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarih</span>
                  <span>{formatEventDate(event.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bilet türü</span>
                  <span>{selectedType?.name ?? 'Genel Giriş'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bilet adedi</span>
                  <span>{quantity}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Kupon indirimi</span>
                    <span>-{couponDiscount} ₺</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Toplam</span>
                  <span className="text-primary">
                    {total === 0 ? 'Ücretsiz' : `${total} ₺`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Geri
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  {isPaid ? 'Ödemeye Geç' : 'Bileti Onayla'}
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <form
              onSubmit={handleCheckout}
              className="space-y-4 rounded-2xl border bg-card p-6"
            >
              <h2 className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-5" />
                5. {isPaid ? 'Güvenli Ödeme' : 'Onay'}
              </h2>

              {isPaid ? (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
                  <p>
                    Kart bilgileriniz Bilet Feed sunucularında{' '}
                    <strong>saklanmaz</strong>. Ödeme, onaylı ödeme kuruluşunun
                    güvenli sayfasında tamamlanır (3D Secure).
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="size-3.5 shrink-0" />
                    <span>256-bit SSL · PCI-DSS uyumlu ödeme altyapısı</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ExternalLink className="size-3.5 shrink-0" />
                    <span>Devam ettiğinizde ödeme sayfasına yönlendirilirsiniz</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ücretsiz etkinlik — onayladığınızda QR biletiniz oluşturulur.
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(4)}
                >
                  Geri
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading
                    ? 'Yönlendiriliyor...'
                    : isPaid
                      ? `${total} ₺ — Ödemeye Git`
                      : 'Ücretsiz Bileti Al'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-lg">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-xl">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-bold">{event.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatEventDate(event.startDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.venue}, {event.city}
            </p>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold">
              <span>Toplam</span>
              <span className="text-primary">
                {total === 0 ? 'Ücretsiz' : `${total} ₺`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
