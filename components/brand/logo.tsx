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
   * on-dark — koyu zemin (açık renkli logo)
   * on-light — açık zemin (koyu renkli logo)
   * auto — next-themes ile otomatik
   */
  variant?: 'on-dark' | 'on-light' | 'auto';
}

/** Yatay logo oranı — light_tema_logo.png / dark_tema_logo.png */
const LOGO_ASPECT = 2001 / 436;

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
  const height = isLarge ? 52 : 40;
  const width = Math.round(height * LOGO_ASPECT);

  let logoVariant: 'on-dark' | 'on-light' = 'on-dark';
  if (variant === 'auto') {
    logoVariant =
      mounted && resolvedTheme === 'light' ? 'on-light' : 'on-dark';
  } else {
    logoVariant = variant;
  }

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
        src={resolveLogoSrc(logoVariant)}
        alt={siteConfig.name}
        width={width}
        height={height}
        className="h-auto w-auto max-h-[52px] object-contain object-left"
        style={{ maxHeight: height, width: 'auto' }}
        priority
      />
    </Link>
  );
}

/** PNG logo — e-posta, OG, basılı materyal */
export function LogoImage({
  variant = 'on-dark',
  className,
  priority,
  height = 44
}: {
  variant?: 'on-dark' | 'on-light';
  className?: string;
  priority?: boolean;
  height?: number;
}) {
  const width = Math.round(height * LOGO_ASPECT);
  const src = resolveLogoSrc(variant);

  return (
    <Image
      src={src}
      alt={siteConfig.name}
      width={width}
      height={height}
      className={cn('h-auto object-contain', className)}
      priority={priority}
    />
  );
}
