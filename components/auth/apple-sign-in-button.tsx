'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 814 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 203.7 133.8 204.9-.6 1.9-20.7 71.2-68.7 141.2-42.4 61.6-86.3 123.1-154.7 124.3-67.4 1.2-89-40.5-167-40.5-78 0-102.3 39.3-166.9 41.7-67.1 2.4-118.1-67.9-160.7-129.5C69.5 685.9 27.8 577.8 27.8 476.7c0-174.8 113.5-267.6 225.2-267.6 59.3 0 108.7 39.5 146.1 39.5 37 0 94.8-41.8 167.6-35.7 28.5 1.2 108.1 11.4 159.1 85.7-4.1 2.5-95.1 55.6-94.1 165.8.9 131.4 114.7 175.2 116.1 175.5zM538.7 95.7C589 38.3 580.6 0 578.9 0c-49.7 0-107.5 26.7-142.7 69.3-39.3 47.4-36.3 115.2-3.5 164.4 3.2 5 7.2 10 12.4 15.5 4.7-1.2 89-43.4 93.6-143.5z"
      />
    </svg>
  );
}

type AppleSignInButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
};

/** Apple HIG: siyah arka plan, beyaz logo ve metin, min. 44pt dokunma alanı */
export function AppleSignInButton({
  label,
  loadingLabel,
  loading = false,
  className,
  disabled,
  type = 'button',
  ...props
}: AppleSignInButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black px-4 text-[15px] font-medium text-white transition-opacity',
        'hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      {...props}
    >
      <AppleLogo className="size-[18px] shrink-0" />
      <span>{loading && loadingLabel ? loadingLabel : label}</span>
    </button>
  );
}
