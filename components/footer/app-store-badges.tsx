import Link from 'next/link';
import { Apple, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppStoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Link
        href="/eventjoy"
        aria-label="EventJoy uygulaması"
        className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
      >
        <Apple className="size-7" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Yakında
          </p>
          <p className="text-sm font-semibold">App Store</p>
        </div>
      </Link>
      <Link
        href="/eventjoy"
        aria-label="EventJoy mobil uygulama"
        className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
      >
        <Play className="size-7 fill-current" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Yakında
          </p>
          <p className="text-sm font-semibold">Google Play</p>
        </div>
      </Link>
    </div>
  );
}
