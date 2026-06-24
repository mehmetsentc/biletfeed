'use client';

import { useState, useCallback } from 'react';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  className?: string;
  icon?: 'heart' | 'star';
  /** Event ID — favorileme için gerekli. Yoksa buton görünür ama işlem yapmaz. */
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
  const Icon = icon === 'star' ? Star : Heart;
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // eventId yoksa hiçbir şey yapma
    if (!eventId) return;
    if (loading) return;

    setLoading(true);
    const prev = active;
    setActive(!active); // Optimistic update

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (res.status === 401) {
        // Giriş yapılmamış — revert + shake animasyonu (sayfa değişmez)
        setActive(prev);
        triggerShake();
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
  }, [eventId, active, loading]);

  return (
    <button
      type="button"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm transition-all hover:bg-black/70 disabled:cursor-not-allowed',
        active && '!bg-amber-400/95 !text-white hover:!bg-amber-500',
        shake && 'animate-wiggle',
        className
      )}
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? 'Favorilerden kaldır' : 'Favorilere ekle'}
    >
      <Icon
        className={cn(
          'size-4 transition-transform',
          active && 'fill-current',
          loading && 'opacity-50'
        )}
        strokeWidth={icon === 'star' ? 1.75 : 2}
      />
    </button>
  );
}
