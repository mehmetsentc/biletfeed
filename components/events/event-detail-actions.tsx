'use client';

import { useRouter } from 'next/navigation';
import { Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventDetailActionsProps {
  title: string;
  slug: string;
}

export function EventDetailActions({ title, slug }: EventDetailActionsProps) {
  const router = useRouter();

  async function handleShare() {
    const url = `${window.location.origin}/etkinlik/${slug}`;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full"
        aria-label="Favorilere ekle"
        onClick={() => router.push('/favorilerim')}
      >
        <Star className="size-4" strokeWidth={1.75} />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full"
        aria-label="Paylaş"
        onClick={() => void handleShare()}
      >
        <Share2 className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
