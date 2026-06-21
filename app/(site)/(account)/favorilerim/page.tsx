import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { EventifyCard } from '@/components/events/eventify-card';
import { Button } from '@/components/ui/button';
import type { MockEvent } from '@/lib/data/mock-events';
import {
  getFeaturedEvents,
  getTrendingEvents
} from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'İlgilendiğim Etkinlikler',
  path: '/favorilerim'
});

async function getInterestedEvents(): Promise<MockEvent[]> {
  const [featured, trending] = await Promise.all([
    getFeaturedEvents(),
    getTrendingEvents()
  ]);
  const combined = [...featured, ...trending];
  const seen = new Set<string>();
  return combined.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  }).slice(0, 6);
}

export default async function FavoritesPage() {
  const favorites = await getInterestedEvents();

  return (
    <div className="min-h-[60vh] bg-muted/30">
      {/* Başlık — Figma */}
      <div className="border-b bg-background">
        <div className="container mx-auto flex items-center gap-3 px-4 py-6 md:py-8">
          <Link
            href="/etkinlikler"
            className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">
            İlgilendiğim Etkinlikler
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-10">
        {favorites.length === 0 ? (
          <div className="rounded-lg border bg-card py-20 text-center">
            <Star className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 font-medium">Henüz ilgilendiğiniz etkinlik yok</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Beğendiğiniz etkinlikleri yıldızlayarak buraya ekleyin
            </p>
            <Link href="/etkinlikler">
              <Button className="mt-6">Etkinlikleri Keşfet</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((event) => (
              <EventifyCard key={event.id} event={event} isFavorite />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
