'use client';

import { Lock } from 'lucide-react';
import { PaymentCardLogos } from '@/components/checkout/payment-card-logos';
import { Separator } from '@/components/ui/separator';
import type { MockEvent } from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

type BfOrderSummaryProps = {
  event: MockEvent;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  className?: string;
};

export function BfOrderSummary({
  event,
  ticketTypeName,
  quantity,
  unitPrice,
  discount,
  className
}: BfOrderSummaryProps) {
  const subtotal = event.isFree ? 0 : unitPrice * quantity;
  const total = Math.max(0, subtotal - discount);
  const isPaid = total > 0;

  return (
    <aside
      className={cn(
        'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="h-1 bg-gradient-to-r from-primary to-[#F57C00]" />
      <div className="p-5">
        <h3 className="text-sm font-bold text-foreground">Sipariş Özeti</h3>

        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{ticketTypeName}</span>
            <span className="shrink-0 font-medium">{quantity} adet</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Bilet fiyatı</span>
            <span className="shrink-0 font-medium">
              {subtotal === 0 ? 'Ücretsiz' : `${subtotal.toLocaleString('tr-TR')} ₺`}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between gap-3 text-emerald-600">
              <span>İndirim</span>
              <span>-{discount.toLocaleString('tr-TR')} ₺</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Toplam</span>
          <span className="text-2xl font-extrabold text-primary">
            {total === 0 ? 'Ücretsiz' : `${total.toLocaleString('tr-TR')} ₺`}
          </span>
        </div>

        {isPaid && (
          <div className="mt-5 space-y-3 rounded-xl bg-zinc-50 p-3">
            <PaymentCardLogos className="justify-center" logoClassName="h-5 w-auto" />
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <Lock className="size-3 shrink-0 text-primary" aria-hidden />
              3D Secure ile güvenli ödeme
            </p>
          </div>
        )}

        {!isPaid && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ücretsiz etkinlik — onay sonrası QR biletiniz anında oluşur.
          </p>
        )}
      </div>
    </aside>
  );
}

export function BfPriceRow({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className={highlight ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <span className={highlight ? 'text-xl font-extrabold text-primary' : 'font-semibold'}>
        {value}
      </span>
    </div>
  );
}
