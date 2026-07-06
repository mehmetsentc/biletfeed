'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  detectCardBrand,
  formatCardNumberDisplay,
  formatExpiryInput,
  isExpiryValid,
  isValidCardNumber,
  isValidCvv,
  normalizeCardNumber,
  normalizeExpiry
} from '@/lib/payments/card-validation';
import { cn } from '@/lib/utils';

export type ToslaCardPaymentFormProps = {
  sessionId: string;
  processCardFormUrl: string;
  total: number;
  eventTitle: string;
  ticketSummary: string;
  cancelHref: string;
  onUseHostedFallback?: () => void;
};

type FieldErrors = Partial<Record<'holder' | 'number' | 'expiry' | 'cvv', string>>;

export function ToslaCardPaymentForm({
  sessionId,
  processCardFormUrl,
  total,
  eventTitle,
  ticketSummary,
  cancelHref,
  onUseHostedFallback
}: ToslaCardPaymentFormProps) {
  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const formattedTotal = total.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function validate(): boolean {
    const next: FieldErrors = {};
    const digits = normalizeCardNumber(cardNumber);

    if (holderName.trim().length < 3) {
      next.holder = 'Kart üzerindeki ad soyad en az 3 karakter olmalıdır.';
    }
    if (!isValidCardNumber(digits)) {
      next.number = 'Geçerli bir kart numarası girin.';
    }
    if (!isExpiryValid(expiry)) {
      next.expiry = 'Son kullanma tarihi geçersiz veya süresi dolmuş.';
    }
    if (!isValidCvv(cvv, digits)) {
      next.cvv = brand === 'amex' ? 'AMEX için 4 haneli CVV girin.' : '3 haneli CVV girin.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!validate()) {
      e.preventDefault();
      return;
    }
    setSubmitting(true);
    // Native form POST — kart bilgisi doğrudan Tosla'ya gider
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div
        className="border-b border-border px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #e8940f 100%)'
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary-foreground">
            <CreditCard className="size-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Güvenli Ödeme</span>
          </div>
          <PaymentCardLogos logoClassName="h-6 w-auto brightness-0 invert opacity-90" />
        </div>
        <p className="mt-3 text-lg font-extrabold text-primary-foreground">{eventTitle}</p>
        <p className="mt-1 text-sm text-primary-foreground/90">{ticketSummary}</p>
      </div>

      <form
        action={processCardFormUrl}
        method="POST"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="p-6"
        noValidate
      >
        <input type="hidden" name="ThreeDSessionId" value={sessionId} />
        <input type="hidden" name="CardNo" value={normalizeCardNumber(cardNumber)} />
        <input type="hidden" name="ExpireDate" value={normalizeExpiry(expiry)} />

        <div className="mb-6 flex items-end justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ödenecek tutar
            </p>
            <p className="text-2xl font-extrabold text-foreground">₺{formattedTotal}</p>
          </div>
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider',
              brand === 'visa' && 'bg-blue-600 text-white',
              brand === 'mastercard' && 'bg-zinc-800 text-white',
              brand === 'amex' && 'bg-sky-700 text-white',
              brand === 'unknown' && 'bg-muted text-muted-foreground'
            )}
          >
            {brand === 'unknown' ? 'Kart' : brand}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="CardHolderName">Kart Sahibi</Label>
            <Input
              id="CardHolderName"
              name="CardHolderName"
              value={holderName}
              onChange={(e) => {
                setHolderName(e.target.value.toUpperCase());
                if (errors.holder) setErrors((p) => ({ ...p, holder: undefined }));
              }}
              placeholder="AD SOYAD"
              autoComplete="cc-name"
              className="mt-1.5 uppercase"
              required
            />
            {errors.holder && <p className="mt-1 text-xs text-destructive">{errors.holder}</p>}
          </div>

          <div>
            <Label htmlFor="CardNo">Kart Numarası</Label>
            <Input
              id="CardNo"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(formatCardNumberDisplay(e.target.value));
                if (errors.number) setErrors((p) => ({ ...p, number: undefined }));
              }}
              placeholder="0000 0000 0000 0000"
              className="mt-1.5 font-mono tracking-wider"
              required
            />
            {errors.number && <p className="mt-1 text-xs text-destructive">{errors.number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ExpireDate">Son Kullanma (AA/YY)</Label>
              <Input
                id="ExpireDate"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => {
                  setExpiry(formatExpiryInput(e.target.value));
                  if (errors.expiry) setErrors((p) => ({ ...p, expiry: undefined }));
                }}
                placeholder="MM/YY"
                className="mt-1.5 font-mono"
                required
              />
              {errors.expiry && <p className="mt-1 text-xs text-destructive">{errors.expiry}</p>}
            </div>
            <div>
              <Label htmlFor="Cvv">Güvenlik Kodu (CVV)</Label>
              <Input
                id="Cvv"
                name="Cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvv}
                onChange={(e) => {
                  setCvv(e.target.value.replace(/\D/g, '').slice(0, brand === 'amex' ? 4 : 3));
                  if (errors.cvv) setErrors((p) => ({ ...p, cvv: undefined }));
                }}
                placeholder="•••"
                className="mt-1.5 font-mono"
                required
              />
              {errors.cvv && <p className="mt-1 text-xs text-destructive">{errors.cvv}</p>}
            </div>
          </div>
        </div>

        <Button type="submit" className="mt-6 h-12 w-full rounded-xl text-base font-bold" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Banka doğrulamasına yönlendiriliyor…
            </>
          ) : (
            <>₺{formattedTotal} — Ödemeyi Tamamla</>
          )}
        </Button>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            Kart bilgileriniz BiletFeed sunucularına iletilmez; doğrudan Tosla güvenli ödeme
            altyapısına gönderilir. Ardından bankanızın 3D Secure doğrulaması açılır.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          256-bit SSL · PCI-DSS uyumlu altyapı
        </div>

        <div className="mt-5 flex flex-col items-center gap-2 border-t border-border pt-4 text-center text-sm">
          <Link href={cancelHref} className="text-muted-foreground hover:text-foreground">
            Vazgeç ve geri dön
          </Link>
          {onUseHostedFallback && (
            <button
              type="button"
              onClick={onUseHostedFallback}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Kart formu açılmıyorsa alternatif ödeme sayfasını dene
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
