import Image from 'next/image';
import { cn } from '@/lib/utils';

type PaymentCardLogosProps = {
  className?: string;
  logoClassName?: string;
};

/** Public asset cache-bust — dosya değişince artır */
const PAYMENT_LOGO_ASSET_V = '3';

const PAYMENT_LOGOS = [
  {
    id: 'visa',
    src: `/payment/visa.png?v=${PAYMENT_LOGO_ASSET_V}`,
    alt: 'Visa',
    width: 72,
    height: 50
  },
  {
    id: 'mastercard',
    src: `/payment/mastercard.png?v=${PAYMENT_LOGO_ASSET_V}`,
    alt: 'Mastercard',
    width: 72,
    height: 50
  },
  {
    id: 'troy',
    src: `/payment/troy.png?v=${PAYMENT_LOGO_ASSET_V}`,
    alt: "Troy — Türkiye'nin Ödeme Yöntemi",
    width: 80,
    height: 40
  },
  {
    id: 'iyzico',
    src: `/payment/iyzico.png?v=${PAYMENT_LOGO_ASSET_V}`,
    alt: 'iyzico',
    width: 96,
    height: 36
  }
] as const;

export function PaymentCardLogos({
  className,
  logoClassName
}: PaymentCardLogosProps) {
  return (
    <div
      role="img"
      aria-label="Kabul edilen ödeme yöntemleri: Visa, Mastercard, Troy ve iyzico"
      className={cn('flex flex-wrap items-center gap-2.5', className)}
    >
      {PAYMENT_LOGOS.map((logo) => (
        <span
          key={logo.id}
          className="inline-flex h-8 max-h-8 shrink-0 items-center overflow-hidden rounded-md sm:h-9 sm:max-h-9"
          title={logo.alt}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={cn(
              'h-full w-auto max-h-8 object-contain sm:max-h-9',
              logoClassName
            )}
            unoptimized
          />
        </span>
      ))}
    </div>
  );
}
