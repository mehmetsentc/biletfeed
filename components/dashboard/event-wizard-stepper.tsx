'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultSteps = ['Düzenle', 'Banner', 'Biletler', 'İnceleme'];

interface EventWizardStepperProps {
  current: number;
  steps?: string[];
  className?: string;
}

function StepCircle({
  step,
  active,
  done,
  size
}: {
  step: number;
  active: boolean;
  done: boolean;
  size: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 font-bold transition-all',
        size === 'sm' ? 'size-7 text-[11px]' : 'size-10 text-sm',
        active &&
          'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25',
        done && 'border-primary bg-primary text-primary-foreground',
        !active && !done && 'border-border bg-card text-muted-foreground'
      )}
    >
      {done ? (
        <Check className={size === 'sm' ? 'size-3' : 'size-4'} strokeWidth={2.5} />
      ) : (
        step
      )}
    </div>
  );
}

export function EventWizardStepper({
  current,
  steps = defaultSteps,
  className
}: EventWizardStepperProps) {
  const total = steps.length;
  const currentLabel = steps[current - 1] ?? '';
  const progressRatio =
    total > 1 ? (current - 1) / (total - 1) : current >= total ? 1 : 0;
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = stepRefs.current[current - 1];
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [current]);

  const gridStyle = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` };

  return (
    <div className={cn('w-full', className)} aria-label={`Adım ${current} / ${total}`}>
      {/* Mobil — sade ilerleme + hizalı numaralar */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold leading-snug text-foreground">
            <span className="text-muted-foreground">Adım {current} · </span>
            {currentLabel}
          </p>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {current}/{total}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>

        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative min-w-full px-0.5" style={{ minWidth: `${total * 2.25}rem` }}>
            <div
              className="pointer-events-none absolute top-3.5 h-px rounded-full bg-muted"
              style={{ left: `${100 / total / 2}%`, right: `${100 / total / 2}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute top-3.5 h-px rounded-full bg-primary transition-all duration-500 ease-out"
              style={{
                left: `${100 / total / 2}%`,
                width: `calc((100% - ${100 / total}%) * ${progressRatio})`
              }}
              aria-hidden
            />

            <div className="relative grid items-center" style={gridStyle}>
              {steps.map((label, i) => {
                const step = i + 1;
                return (
                  <div
                    key={`${label}-mobile-${i}`}
                    ref={(el) => {
                      stepRefs.current[i] = el;
                    }}
                    className="flex justify-center py-0.5"
                  >
                    <StepCircle
                      step={step}
                      active={step === current}
                      done={step < current}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Masaüstü — tam stepper, etiketler sabit yükseklikte */}
      <div className="hidden md:block">
        <div className="relative">
          <div
            className="pointer-events-none absolute top-5 h-1 rounded-full bg-muted"
            style={{ left: `${100 / total / 2}%`, right: `${100 / total / 2}%` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-5 h-1 rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              left: `${100 / total / 2}%`,
              width: `calc((100% - ${100 / total}%) * ${progressRatio})`
            }}
            aria-hidden
          />

          <div className="relative grid" style={gridStyle}>
            {steps.map((label, i) => {
              const step = i + 1;
              return (
                <div
                  key={`${label}-desktop-circle-${i}`}
                  className="flex justify-center"
                >
                  <StepCircle
                    step={step}
                    active={step === current}
                    done={step < current}
                    size="md"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 grid" style={gridStyle}>
            {steps.map((label, i) => {
              const step = i + 1;
              const active = step === current;
              const done = step < current;
              return (
                <span
                  key={`${label}-desktop-label-${i}`}
                  className={cn(
                    'flex min-h-10 items-start justify-center px-1 text-center text-[11px] font-semibold leading-tight',
                    active || done ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
