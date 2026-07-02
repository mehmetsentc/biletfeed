import Link from 'next/link';
import { Building2, MapPin, Mic2 } from 'lucide-react';
import type { MockOrganizer } from '@/lib/data/mock-organizers';
import type { FavoriteVenue } from '@/lib/services/favorites';
import { SafeImage } from '@/components/shared/safe-image';

interface FollowedEntitiesSectionProps {
  organizers: MockOrganizer[];
  venues: FavoriteVenue[];
}

function FollowChip({
  href,
  label,
  sublabel,
  image,
  fallbackIcon: FallbackIcon
}: {
  href: string;
  label: string;
  sublabel?: string;
  image?: string;
  fallbackIcon: typeof Mic2;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/40"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {image ? (
          <SafeImage
            src={image}
            alt={label}
            fill
            className="object-cover"
            fallback={
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <FallbackIcon className="size-4" strokeWidth={1.75} />
              </div>
            }
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <FallbackIcon className="size-4" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        {sublabel && (
          <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </Link>
  );
}

export function FollowedEntitiesSection({
  organizers,
  venues
}: FollowedEntitiesSectionProps) {
  const hasFollows = organizers.length > 0 || venues.length > 0;

  if (!hasFollows) {
    return (
      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4 md:px-6">
          <h2 className="font-semibold">Takip Ettiklerim</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sanatçı, organizatör ve mekanları takip ettiğinizde burada görünür.
          </p>
        </div>
        <div className="px-5 py-8 text-center md:px-6">
          <p className="text-sm text-muted-foreground">
            Henüz kimseyi takip etmiyorsunuz.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/organizatorler"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Organizatörleri keşfet
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/mekanlar"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Mekanları keşfet
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <h2 className="font-semibold">Takip Ettiklerim</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Takip ettiğiniz sanatçı, organizatör ve mekanlar.
          </p>
        </div>
        <Link
          href="/favorilerim"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Tümünü gör
        </Link>
      </div>

      <div className="space-y-6 px-5 py-5 md:px-6">
        {organizers.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Building2 className="size-3.5" />
              Sanatçı & Organizatör
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {organizers.slice(0, 6).map((org) => (
                <FollowChip
                  key={org.id}
                  href={`/organizator/${org.slug}`}
                  label={org.name}
                  sublabel={`${org.eventCount} etkinlik`}
                  image={org.logo}
                  fallbackIcon={Mic2}
                />
              ))}
            </div>
          </div>
        )}

        {venues.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="size-3.5" />
              Mekanlar
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {venues.slice(0, 6).map((venue) => (
                <FollowChip
                  key={venue.id}
                  href={`/mekanlar/${venue.slug}`}
                  label={venue.name}
                  sublabel={venue.city}
                  image={venue.image}
                  fallbackIcon={MapPin}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
