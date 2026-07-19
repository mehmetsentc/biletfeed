import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultLabels = ['Bilet Seç', 'Katılımcı', 'Özet', 'Ödeme'];

interface StepIndicatorProps {
  current: number;
  labels?: string[];
  className?: string;
}

export function StepIndicator({
  current,
  labels = defaultLabels,
  className
}: StepIndicatorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-[var(--bf-accent-ink)]',
                  !done && !active && 'border-muted bg-muted text-muted-foreground'
                )}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : step}
              </div>
              <span
                className={cn(
                  'hidden text-center text-xs sm:block',
                  active && 'font-semibold text-[var(--bf-accent-ink)]',
                  done && 'text-foreground',
                  !done && !active && 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((current - 1) / (labels.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
