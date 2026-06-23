import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function WizardFormRow({
  label,
  required,
  children,
  className,
  alignTop,
  hint
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  alignTop?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 border-b border-border/60 py-5 last:border-b-0 sm:gap-4 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]',
        alignTop ? 'items-start' : 'items-center',
        className
      )}
    >
      <div>
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function WizardFormSection({
  title,
  description,
  icon: Icon,
  children,
  className
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className
      )}
    >
      <div className="border-b border-border/60 bg-muted/30 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
          )}
          <div>
            <h2 className="text-base font-bold text-foreground md:text-lg">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 md:px-6">{children}</div>
    </section>
  );
}

export function WizardSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}

export function WizardTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-36 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className
      )}
      {...props}
    />
  );
}

export function WizardOptionCards<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    id: T;
    title: string;
    description?: string;
    icon?: LucideIcon;
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all',
              active
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30'
            )}
          >
            {Icon && (
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="size-4" />
              </span>
            )}
            <div>
              <p className="font-semibold text-foreground">{option.title}</p>
              {option.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
