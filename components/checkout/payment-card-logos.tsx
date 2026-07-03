import Image from 'next/image';
import { cn } from '@/lib/utils';

type PaymentCardLogosProps = {
  className?: string;
  logoClassName?: string;
};

const PAYMENT_LOGOS = [
  {
    id: 'visa',
    src: '/payment/visa.png',
    alt: 'Visa',
    width: 64,
    height: 40
  },
  {
    id: 'mastercard',
    src: '/payment/mastercard.png',
    alt: 'Mastercard',
    width: 64,
    height: 40
  },
  {
    id: 'troy',
    src: '/payment/troy.png',
    alt: 'Troy — Türkiye\'nin Ödeme Yöntemi',
    width: 80,
    height: 40
  }
] as const;

export function PaymentCardLogos({
  className,
  logoClassName = 'h-8 w-auto sm:h-9'
}: PaymentCardLogosProps) {
  return (
    <div
      role="img"
      aria-label="Kabul edilen ödeme kartları: Visa, Mastercard ve Troy"
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
          />
        </span>
      ))}
    </div>
  );
}
