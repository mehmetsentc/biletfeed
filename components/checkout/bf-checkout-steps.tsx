'use client';

import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';

type BfCheckoutStepsProps = {
  current: 1 | 2 | 3;
  className?: string;
};

export function BfCheckoutSteps({ current, className }: BfCheckoutStepsProps) {
  const t = useTranslations();
  const steps = [t.purchase.stepTicket, t.purchase.stepInfo, t.purchase.stepPay] as const;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const active = step === current;
        const done = step < current;

        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary/15 text-primary ring-2 ring-primary',
                  !done && !active && 'bg-muted text-muted-foreground'
                )}
              >
                {done ? '✓' : step}
              </div>
              <span
                className={cn(
                  'hidden truncate text-center text-[11px] font-medium sm:block',
                  active && 'text-primary',
                  done && 'text-foreground',
                  !done && !active && 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-0.5 flex-1 rounded-full sm:mb-6',
                  done ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** İç adım: bilet türü → adet */
export function BfSubStepLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</p>
  );
}
