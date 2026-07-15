'use client';

import { useState, useCallback } from 'react';
import { Heart, Star } from 'lucide-react';
import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  className?: string;
  icon?: 'heart' | 'star';
  /** Event ID — favorileme için gerekli. Yoksa buton görünür ama işlem yapmaz. */
  eventId?: string;
  /** Initial active state (from server) */
  initialActive?: boolean;
  variant?: 'overlay' | 'outline';
}

export function FavoriteButton({
  className,
  icon = 'heart',
  eventId,
  initialActive = false,
  variant = 'overlay'
}: FavoriteButtonProps) {
  const t = useTranslations();
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
        variant === 'outline'
          ? 'flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-none transition-colors hover:bg-muted disabled:cursor-not-allowed'
          : 'flex size-9 items-center justify-center rounded-full bg-black/50 text-white shadow-md backdrop-blur-sm transition-all hover:bg-black/70 disabled:cursor-not-allowed',
        variant === 'outline' && active && 'border-primary/40 bg-primary/10 text-primary',
        variant === 'overlay' && active && '!bg-amber-400/95 !text-white hover:!bg-amber-500',
        shake && 'animate-wiggle',
        className
      )}
      onClick={handleClick}
      disabled={loading}
      aria-label={active ? t.events.removeFavorite : t.events.addFavorite}
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
