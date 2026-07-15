import { cn } from '@/lib/utils';

export function SettingsField({
  label,
  children,
  className,
  hint
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 md:rounded-none md:border-0 md:border-b md:bg-transparent md:p-0 md:py-5 md:last:border-b-0',
        'md:grid md:grid-cols-[180px_1fr] md:items-center md:gap-4 lg:grid-cols-[200px_1fr]',
        className
      )}
    >
      <div>
        <label className="text-sm font-semibold text-foreground">{label}</label>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground md:hidden">{hint}</p>
        )}
      </div>
      <div className="mt-2 min-w-0 md:mt-0">{children}</div>
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 md:mt-10 md:first:mt-0">
      <h2 className="text-base font-bold md:text-lg">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-3 space-y-3 md:mt-4 md:space-y-0 md:rounded-lg md:border md:border-border md:px-4">
        {children}
      </div>
    </section>
  );
}

export function SettingsPageHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-border pb-4 md:pb-6">
      <h1 className="text-xl font-bold md:text-2xl lg:text-3xl">{title}</h1>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </header>
  );
}

export function SettingsSaveBar({
  label,
  savedLabel,
  onClick,
  saved
}: {
  label: string;
  savedLabel?: string;
  onClick?: () => void;
  saved?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 px-4 py-3 backdrop-blur-md md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button
          type="button"
          onClick={onClick}
          className="h-12 w-full rounded-xl bg-[#1a1d23] text-sm font-bold text-white transition-colors hover:bg-[#1a1d23]/90 md:h-10 md:w-auto md:rounded-md md:px-8"
        >
          {saved ? savedLabel ?? label : label}
        </button>
      </div>
      <div className="h-[4.5rem] md:hidden" aria-hidden />
    </>
  );
}
