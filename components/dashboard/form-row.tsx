import { cn } from '@/lib/utils';

interface FormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  alignTop?: boolean;
}

export function FormRow({
  label,
  required,
  children,
  className,
  alignTop
}: FormRowProps) {
  return (
    <div
      className={cn(
        'grid gap-4 border-b border-border py-6 last:border-b-0 md:grid-cols-[220px_1fr]',
        alignTop && 'items-start',
        !alignTop && 'items-center',
        className
      )}
    >
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <section className={cn('space-y-1', className)}>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="rounded-lg border border-border bg-card">{children}</div>
    </section>
  );
}
