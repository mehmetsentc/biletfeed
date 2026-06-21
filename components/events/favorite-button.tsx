'use client';

import { useRouter } from 'next/navigation';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  className?: string;
  icon?: 'heart' | 'star';
  active?: boolean;
}

export function FavoriteButton({
  className,
  icon = 'heart',
  active = false
}: FavoriteButtonProps) {
  const router = useRouter();
  const Icon = icon === 'star' ? Star : Heart;

  return (
    <button
      type="button"
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push('/favorilerim');
      }}
      aria-label={active ? 'İlgilenmeyi kaldır' : 'Favorilere ekle'}
    >
      <Icon
        className={cn('size-4', active && 'fill-foreground')}
        strokeWidth={icon === 'star' ? 1.75 : 2}
      />
    </button>
  );
}
