'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { siteConfig } from '@/lib/config/site';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  href?: string;
  size?: 'default' | 'large';
  /**
   * on-dark — siyah header / koyu zemin (dark theme logo)
   * on-light — açık zemin (light theme logo)
   * auto — next-themes ile otomatik
   */
  variant?: 'on-dark' | 'on-light' | 'auto';
}

const LOGO_WIDTH = 182;
const LOGO_HEIGHT = 50;

function resolveLogoSrc(variant: 'on-dark' | 'on-light'): string {
  return variant === 'on-dark'
    ? brandAssetUrl(brandLogos.forDarkSurface)
    : brandAssetUrl(brandLogos.forLightSurface);
}

export function Logo({
  className,
  href = '/',
  size = 'default',
  variant = 'auto'
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLarge = size === 'large';
  const height = isLarge ? 58 : 44;
  const width = isLarge ? 210 : 160;

  let logoVariant: 'on-dark' | 'on-light' = 'on-dark';
  if (variant === 'auto') {
    logoVariant =
      mounted && resolvedTheme === 'light' ? 'on-light' : 'on-dark';
  } else {
    logoVariant = variant;
  }

  const src = resolveLogoSrc(logoVariant);

  return (
    <Link
      href={href}
      aria-label={siteConfig.name}
      className={cn(
        'group inline-flex shrink-0 items-center transition-opacity hover:opacity-90',
        className
      )}
    >
      <Image
        src={src}
        alt={siteConfig.name}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority
        className="block h-auto w-auto object-contain object-left"
        style={{ width, height: 'auto', maxHeight: height }}
      />
    </Link>
  );
}

/** PNG logo — e-posta, OG, basılı materyal */
export function LogoImage({
  variant = 'on-dark',
  className,
  priority,
  width = LOGO_WIDTH,
  height = LOGO_HEIGHT
}: {
  variant?: 'on-dark' | 'on-light';
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const src = resolveLogoSrc(variant);

  return (
    <Image
      src={src}
      alt={siteConfig.name}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
