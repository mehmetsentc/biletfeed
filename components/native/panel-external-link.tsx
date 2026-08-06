'use client';

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react';
import { openOrganizerPanel } from '@/lib/native/open-panel';
import { panelHref } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

type PanelExternalLinkProps = {
  path: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'onClick'>;

/**
 * Organizatör paneli linki — native app'te sistem tarayıcısı + oturum handoff.
 * Web'de yeni sekme (yine handoff denemesi; yoksa düz URL).
 */
export function PanelExternalLink({
  path,
  children,
  className,
  onClick,
  ...rest
}: PanelExternalLinkProps) {
  const href = panelHref(path);

  async function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    onClick?.(e);
    await openOrganizerPanel(path);
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(className)}
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  );
}
