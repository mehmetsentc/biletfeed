import Link from 'next/link';
import { Apple, Play, Smartphone } from 'lucide-react';
import { mobileAppConfig } from '@/lib/config/mobile-app';
import { cn } from '@/lib/utils';

type AppStoreBadgesProps = {
  className?: string;
  /** Siyah footer gibi koyu arka planlarda kullanın */
  variant?: 'light' | 'dark';
};

export function AppStoreBadges({ className, variant = 'light' }: AppStoreBadgesProps) {
  const iosUrl = mobileAppConfig.storeUrls.ios.trim();
  const androidUrl = mobileAppConfig.storeUrls.android.trim();
  const fallbackUrl = mobileAppConfig.appInfoUrl;

  const iosSoon = !iosUrl;
  const androidSoon = !androidUrl;
  const bothSoon = iosSoon && androidSoon;

  /** Her iki mağaza URL'si boşken tek "Mobil Uygulama" CTA — çift badge /mobil-uygulama tekrarını önler */

  const badgeClass =
    variant === 'dark'
      ? 'inline-flex items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-white transition-colors hover:border-primary/60 hover:bg-white/15'
      : 'inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50';

  const labelClass =
    variant === 'dark'
      ? 'text-[10px] uppercase tracking-wide text-white/60'
      : 'text-[10px] uppercase tracking-wide text-muted-foreground';

  const titleClass = variant === 'dark' ? 'text-sm font-semibold text-white' : 'text-sm font-semibold';

  if (bothSoon) {
    return (
      <div className={cn('flex flex-wrap gap-3', className)}>
        <Link
          href={fallbackUrl}
          aria-label="BiletFeed mobil uygulama — yakında"
          className={badgeClass}
        >
          <Smartphone className="size-7 shrink-0" strokeWidth={1.5} />
          <div className="text-left leading-tight">
            <p className={labelClass}>Yakında</p>
            <p className={titleClass}>Mobil Uygulama</p>
          </div>
        </Link>
      </div>
    );
  }

  const iosHref = iosUrl || fallbackUrl;
  const androidHref = androidUrl || fallbackUrl;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Link
        href={iosHref}
        target={iosUrl ? '_blank' : undefined}
        rel={iosUrl ? 'noopener noreferrer' : undefined}
        aria-label="BiletFeed App Store"
        className={badgeClass}
      >
        <Apple className="size-7 shrink-0" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className={labelClass}>{iosSoon ? 'Yakında' : 'İndir'}</p>
          <p className={titleClass}>App Store</p>
        </div>
      </Link>
      <Link
        href={androidHref}
        target={androidUrl ? '_blank' : undefined}
        rel={androidUrl ? 'noopener noreferrer' : undefined}
        aria-label="BiletFeed Google Play"
        className={badgeClass}
      >
        <Play className="size-7 shrink-0 fill-current" strokeWidth={1.5} />
        <div className="text-left leading-tight">
          <p className={labelClass}>{androidSoon ? 'Yakında' : 'İndir'}</p>
          <p className={titleClass}>Google Play</p>
        </div>
      </Link>
    </div>
  );
}
