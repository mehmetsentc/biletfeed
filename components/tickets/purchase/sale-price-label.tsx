import { cn } from '@/lib/utils';
import { formatTry } from '@/lib/tickets/purchase-pricing';

/** Liste fiyatı üstü çizili + indirimli fiyat */
export function SalePriceLabel({
  price,
  listPrice,
  isOnSale,
  discountPercent,
  freeLabel = 'Ücretsiz',
  className,
  priceClassName
}: {
  price: number;
  listPrice?: number;
  isOnSale?: boolean;
  discountPercent?: number | null;
  freeLabel?: string;
  className?: string;
  priceClassName?: string;
}) {
  if (price <= 0) {
    return <p className={cn('text-xl font-extrabold tracking-tight', className)}>{freeLabel}</p>;
  }

  const showSale =
    Boolean(isOnSale) &&
    listPrice != null &&
    listPrice > price;

  if (!showSale) {
    return (
      <p className={cn('text-xl font-extrabold tracking-tight', priceClassName, className)}>
        {formatTry(price)}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col items-end gap-0.5', className)}>
      <span className="text-sm text-muted-foreground line-through">
        {formatTry(listPrice)}
      </span>
      <span className={cn('text-xl font-extrabold tracking-tight text-primary', priceClassName)}>
        {formatTry(price)}
      </span>
      {discountPercent ? (
        <span className="text-[11px] font-semibold text-primary">%{discountPercent} indirim</span>
      ) : null}
    </div>
  );
}
