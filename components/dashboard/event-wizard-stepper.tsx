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
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-border" aria-hidden />
        <div
          className="absolute left-0 top-4 h-0.5 bg-[#1a1d23] transition-all duration-300 dark:bg-indigo-500"
          style={{
            width: `${((current - 1) / (steps.length - 1)) * 100}%`
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
                  'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                  active && 'border-[#1a1d23] bg-[#1a1d23] text-white',
                  done && 'border-[#1a1d23] bg-[#1a1d23] text-white',
                  !active && !done && 'border-border bg-background text-muted-foreground'
                )}
              >
                {step}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  active ? 'text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'
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
