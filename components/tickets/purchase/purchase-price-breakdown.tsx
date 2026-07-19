import { Separator } from '@/components/ui/separator';
import {
  calculatePurchasePricing,
  formatTry,
  type PurchasePricing
} from '@/lib/tickets/purchase-pricing';
import { cn } from '@/lib/utils';

interface PurchasePriceBreakdownProps {
  unitPrice: number;
  quantity: number;
  discount?: number;
  className?: string;
  compact?: boolean;
}

export function PurchasePriceBreakdown({
  unitPrice,
  quantity,
  discount = 0,
  className,
  compact = false
}: PurchasePriceBreakdownProps) {
  const pricing = calculatePurchasePricing({ unitPrice, quantity, discount });

  return (
    <PriceBreakdownRows pricing={pricing} className={className} compact={compact} />
  );
}

export function PriceBreakdownRows({
  pricing,
  className,
  compact = false
}: {
  pricing: PurchasePricing;
  className?: string;
  compact?: boolean;
}) {
  const isFree = pricing.total <= 0;

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      <Row
        label={`Bilet fiyatı (${pricing.quantity} adet)`}
        value={formatTry(pricing.ticketSubtotal)}
        compact={compact}
      />
      {pricing.discount > 0 && (
        <Row
          label="Kupon indirimi"
          value={`-${formatTry(pricing.discount)}`}
          compact={compact}
          valueClassName="text-[var(--bf-success)]"
        />
      )}
      <Separator className="my-3" />
      <div className="flex items-center justify-between">
        <span className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
          Toplam
        </span>
        <span
          className={cn(
            'font-extrabold text-[var(--bf-accent-ink)]',
            compact ? 'text-base' : 'text-xl',
            isFree && 'text-[var(--bf-success)]'
          )}
        >
          {formatTry(pricing.total)}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  compact,
  valueClassName
}: {
  label: string;
  value: string;
  compact?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn('text-muted-foreground', compact && 'text-xs')}>{label}</span>
      <span className={cn('font-medium', compact && 'text-xs', valueClassName)}>
        {value}
      </span>
    </div>
  );
}
