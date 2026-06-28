import { brandTheme } from '@/lib/config/brand-theme';
import { cn } from '@/lib/utils';

interface BiletFeedWordmarkProps {
  variant: 'on-dark' | 'on-light';
  className?: string;
  height?: number;
}

/** Vektör wordmark — şeffaf zemin, light/dark header uyumlu */
export function BiletFeedWordmark({
  variant,
  className,
  height = 44
}: BiletFeedWordmarkProps) {
  const biletFill =
    variant === 'on-dark' ? brandTheme.white : brandTheme.black;
  const orange = brandTheme.orange;
  const width = Math.round(height * (196 / 52));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 196 52"
      width={width}
      height={height}
      fill="none"
      role="img"
      aria-hidden
      className={cn('block shrink-0', className)}
    >
      <text
        x="0"
        y="38"
        fill={biletFill}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="34"
        fontWeight="800"
      >
        Bilet
      </text>
      <circle cx="27" cy="12" r="5" fill={orange} />

      {/* Bilet ticket gövdesi */}
      <rect x="92" y="8" width="98" height="36" rx="6" fill={orange} />

      <text
        x="102"
        y="36"
        fill={brandTheme.black}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="26"
        fontWeight="800"
      >
        Feed
      </text>

      {/* Perforasyon noktaları */}
      {[18, 22, 26, 30, 34].map((y) => (
        <circle key={y} cx="162" cy={y} r="1.6" fill={brandTheme.black} />
      ))}
    </svg>
  );
}
