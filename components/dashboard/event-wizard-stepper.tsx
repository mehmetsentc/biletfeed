import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultSteps = ['Düzenle', 'Banner', 'Biletler', 'İnceleme'];

interface EventWizardStepperProps {
  current: number;
  steps?: string[];
  className?: string;
}

export function EventWizardStepper({
  current,
  steps = defaultSteps,
  className
}: EventWizardStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-center justify-between">
        <div
          className="absolute left-0 right-0 top-5 h-1 rounded-full bg-muted"
          aria-hidden
        />
        <div
          className="absolute left-0 top-5 h-1 rounded-full bg-primary transition-all duration-500 ease-out"
          style={{
            width: `${((current - 1) / Math.max(steps.length - 1, 1)) * 100}%`
          }}
          aria-hidden
        />

        {steps.map((label, i) => {
          const step = i + 1;
          const active = step === current;
          const done = step < current;

          return (
            <div
              key={label}
              className="relative z-10 flex flex-1 flex-col items-center gap-2"
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all',
                  active &&
                    'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25',
                  done &&
                    'border-primary bg-primary text-primary-foreground',
                  !active &&
                    !done &&
                    'border-border bg-card text-muted-foreground'
                )}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : step}
              </div>
              <span
                className={cn(
                  'text-center text-xs font-semibold',
                  active || done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
