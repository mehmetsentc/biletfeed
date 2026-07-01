'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FollowTargetType } from '@/lib/services/follows';

interface FollowButtonProps {
  type: FollowTargetType;
  targetId: string;
  initialActive?: boolean;
  className?: string;
  /** Compact style for inline event detail sections */
  variant?: 'default' | 'dark';
  showIcon?: boolean;
}

export function FollowButton({
  type,
  targetId,
  initialActive = false,
  className,
  variant = 'default',
  showIcon = false
}: FollowButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!targetId || loading) return;

    setLoading(true);
    const prev = active;
    setActive(!active);

    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetId })
      });

      if (res.status === 401) {
        setActive(prev);
        router.push(`/giris?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!res.ok) {
        setActive(prev);
        return;
      }

      const data = (await res.json()) as { active: boolean };
      setActive(data.active);
    } catch {
      setActive(prev);
    } finally {
      setLoading(false);
    }
  }, [type, targetId, active, loading, pathname, router]);

  const label = active ? 'Takip Ediliyor' : 'Takip Et';

  if (variant === 'dark') {
    return (
      <Button
        type="button"
        className={cn(
          'rounded-md px-6 text-white',
          active
            ? 'bg-primary hover:bg-primary/90'
            : 'bg-[#1a1d23] hover:bg-[#1a1d23]/90',
          className
        )}
        onClick={() => void handleClick()}
        disabled={loading}
        aria-pressed={active}
      >
        {showIcon && active ? (
          <UserCheck className="mr-1.5 size-4" />
        ) : !active ? (
          '+ '
        ) : null}
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'default'}
      className={cn(className)}
      onClick={() => void handleClick()}
      disabled={loading}
      aria-pressed={active}
    >
      {showIcon && active && <UserCheck className="mr-1.5 size-4" />}
      {label}
    </Button>
  );
}
