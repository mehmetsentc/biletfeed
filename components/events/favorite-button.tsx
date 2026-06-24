'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  className?: string;
  icon?: 'heart' | 'star';
  /** Event ID — if provided, toggles favorite via API. Without it navigates to /favorilerim */
  eventId?: string;
  /** Initial active state (from server) */
  initialActive?: boolean;
}

export function FavoriteButton({
  className,
  icon = 'heart',
  eventId,
  initialActive = false
}: FavoriteButtonProps) {
  const router = useRouter();
  const Icon = icon === 'star' ? Star : Heart;
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!eventId) {
      router.push('/favorilerim');
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prev = active;
    setActive(!active);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (res.status === 401) {
        // Not logged in — revert & redirect to login
        setActive(prev);
        router.push('/giris?redirect=/favorilerim');
        return;
      }

      if (!res.ok) {
        setActive(prev);
        return;
      }

      const data = await res.json() as { active: boolean };
      setActive(data.active);
    } catch {
      setActive(prev);
    } finally {
      setLoading(false);
    }
  }, [eventId, active, loading, router]);

  return (
    <button
      type="button"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm transition-all hover:bg-black/70 disabled:cursor-not-allowed',
        active && 'bg-red-500/90 text-white hover:bg-red-600/90',
        className
      )}
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? 'Favorilerden kaldır' : 'Favorilere ekle'}
    >
      <Icon
        className={cn(
          'size-4 transition-transform',
          active && (icon === 'heart' ? 'fill-white text-white' : 'fill-white text-white'),
          loading && 'opacity-50'
        )}
        strokeWidth={icon === 'star' ? 1.75 : 2}
      />
    </button>
  );
}
