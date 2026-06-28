import Link from 'next/link';
import { Apple, Play } from 'lucide-react';
import { mobileAppConfig } from '@/lib/config/mobile-app';
import { cn } from '@/lib/utils';

export function AppStoreBadges({ className }: { className?: string }) {
  const iosUrl = mobileAppConfig.storeUrls.ios.trim();
  const androidUrl = mobileAppConfig.storeUrls.android.trim();
  const fallbackUrl = mobileAppConfig.appInfoUrl;

  const iosHref = iosUrl || fallbackUrl;
  const androidHref = androidUrl || fallbackUrl;
  const iosSoon = !iosUrl;
  const androidSoon = !androidUrl;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Link
        href={iosHref}
        target={iosUrl ? '_blank' : undefined}
        rel={iosUrl ? 'noopener noreferrer' : undefined}
        aria-label="BiletFeed App Store"
        className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
      >
        <Apple className="size-7" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {iosSoon ? 'Yakında' : 'İndir'}
          </p>
          <p className="text-sm font-semibold">App Store</p>
        </div>
      </Link>
      <Link
        href={androidHref}
        target={androidUrl ? '_blank' : undefined}
        rel={androidUrl ? 'noopener noreferrer' : undefined}
        aria-label="BiletFeed Google Play"
        className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
      >
        <Play className="size-7 fill-current" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {androidSoon ? 'Yakında' : 'İndir'}
          </p>
          <p className="text-sm font-semibold">Google Play</p>
        </div>
      </Link>
    </div>
  );
}
