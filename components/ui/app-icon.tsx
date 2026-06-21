import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppIconSize = 'xs' | 'sm' | 'md' | 'lg';
type AppIconVariant = 'default' | 'primary' | 'soft' | 'ghost';

const boxSizes: Record<AppIconSize, string> = {
  xs: 'size-7 rounded-lg',
  sm: 'size-9 rounded-xl',
  md: 'size-11 rounded-xl',
  lg: 'size-14 rounded-2xl'
};

const iconSizes: Record<AppIconSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6'
};

const variants: Record<AppIconVariant, string> = {
  default: 'bg-muted/80 text-muted-foreground ring-1 ring-border/60',
  primary:
    'bg-primary/12 text-primary ring-1 ring-primary/25 shadow-sm shadow-primary/10',
  soft: 'bg-card text-foreground ring-1 ring-border shadow-sm',
  ghost: 'bg-transparent text-muted-foreground'
};

interface AppIconProps {
  icon: LucideIcon;
  size?: AppIconSize;
  variant?: AppIconVariant;
  className?: string;
  label?: string;
}

export function AppIcon({
  icon: Icon,
  size = 'sm',
  variant = 'primary',
  className,
  label
}: AppIconProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        boxSizes[size],
        variants[variant],
        className
      )}
    >
      <Icon className={iconSizes[size]} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
