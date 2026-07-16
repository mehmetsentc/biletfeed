import Image from 'next/image';
import { cn } from '@/lib/utils';

type PaymentCardLogosProps = {
  className?: string;
  logoClassName?: string;
};

/** Public asset cache-bust — dosya değişince artır */
const PAYMENT_LOGO_ASSET_V = '2';

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
    alt: 'Troy — Türkiye\'nin Ödeme Yöntemi',
    width: 80,
    height: 40
  },
  {
    id: 'tosla',
    src: `/payment/tosla.png?v=${PAYMENT_LOGO_ASSET_V}`,
    alt: 'Tosla',
    width: 96,
    height: 36
  }
] as const;

export function PaymentCardLogos({
  className,
  logoClassName = 'h-8 w-auto sm:h-9'
}: PaymentCardLogosProps) {
  return (
    <div
      role="img"
      aria-label="Kabul edilen ödeme yöntemleri: Visa, Mastercard, Troy ve Tosla"
      className={cn('flex flex-wrap items-center gap-2.5', className)}
    >
      {PAYMENT_LOGOS.map((logo) => (
        <span
          key={logo.id}
          className="inline-flex shrink-0 items-center overflow-hidden rounded-md"
          title={logo.alt}
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className={cn('w-auto object-contain', logoClassName)}
            unoptimized
          />
        </span>
      ))}
    </div>
  );
}
