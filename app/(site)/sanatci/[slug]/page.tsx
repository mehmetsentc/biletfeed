import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Calendar, Instagram, Music, Twitter, Youtube, Globe } from 'lucide-react';
import { getArtist } from '@/lib/services/artist';
import { verifySessionCookie } from '@/lib/auth/session';
import { isFollowingArtist } from '@/lib/services/artist';
import { prisma } from '@/lib/db/prisma';
import { ArtistFollowButton } from '@/components/artists/artist-follow-button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/config/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  const name = artist?.name ?? 'Sanatçı';
  return createPageMetadata({
    title: name,
    description: artist?.bio
      ? artist.bio.slice(0, 155)
      : `${name} sanatçısının etkinliklerini Bilet Feed üzerinden keşfedin ve takip edin.`,
    path: `/sanatci/${slug}`,
    keywords: [name, `${name} etkinlik`, `${name} bilet`, 'sanatçı']
  });
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) notFound();

  const session = await verifySessionCookie();

  // Resolve firebase uid → db user id for follow check
  let dbUserId: string | null = null;
  if (session?.uid) {
    const u = await prisma.user.findUnique({
      where: { firebaseUid: session.uid },
      select: { id: true }
    });
    dbUserId = u?.id ?? null;
  }

  const following = dbUserId ? await isFollowingArtist(dbUserId, artist.id) : false;
  const shareUrl = `${siteConfig.url}/sanatci/${artist.slug}`;

  const now = new Date();
  const upcomingEvents = artist.events
    .filter((ea) => ea.event.startDate >= now)
    .sort((a, b) => a.event.startDate.getTime() - b.event.startDate.getTime());
  const pastEvents = artist.events
    .filter((ea) => ea.event.startDate < now)
    .sort((a, b) => b.event.startDate.getTime() - a.event.startDate.getTime())
    .slice(0, 10);

  const socialLinks = artist.socialLinks as {
    instagram?: string;
    twitter?: string;
    spotify?: string;
    youtube?: string;
    soundcloud?: string;
    website?: string;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Avatar */}
        <div className="shrink-0">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={artist.name}
              width={140}
              height={140}
              className="size-36 rounded-full object-cover ring-4 ring-border"
            />
          ) : (
            <div className="size-36 rounded-full bg-muted ring-4 ring-border flex items-center justify-center text-4xl font-bold text-muted-foreground">
              {artist.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-3xl font-bold">{artist.name}</h1>
            {artist.verified && (
              <BadgeCheck className="size-6 text-primary shrink-0" aria-label="Doğrulanmış" />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {artist.type === 'group' ? 'Grup / Organizasyon' : 'Sanatçı'}
            {' · '}
            <span className="font-medium text-foreground">{artist.followerCount.toLocaleString('tr-TR')}</span> takipçi
          </p>

          {artist.bio && (
            <p className="text-sm text-muted-foreground max-w-prose leading-relaxed">{artist.bio}</p>
          )}

          {/* Social links */}
          {Object.values(socialLinks).some(Boolean) && (
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              {socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Instagram className="size-3.5" />
                  Instagram
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${socialLinks.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Twitter className="size-3.5" />
                  Twitter/X
                </a>
              )}
              {socialLinks.spotify && (
                <a
                  href={socialLinks.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Music className="size-3.5" />
                  Spotify
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Youtube className="size-3.5" />
                  YouTube
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Globe className="size-3.5" />
                  Website
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <ArtistFollowButton
              artistId={artist.id}
              initialFollowing={following}
              isLoggedIn={!!session}
            />
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Calendar className="size-5" />
            Yaklaşan Etkinlikler
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingEvents.map(({ event, role }) => (
              <Link
                key={event.id}
                href={`/etkinlik/${event.slug}`}
                className="group flex gap-3 rounded-xl border p-3 hover:bg-muted/40 transition-colors"
              >
                {event.coverImage && (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    width={80}
                    height={80}
                    className="size-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">{event.city.name}</p>
                  {role && (
                    <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-[var(--bf-accent-ink)]">
                      {role}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-muted-foreground">Geçmiş Etkinlikler</h2>
          <div className="grid gap-3 sm:grid-cols-2 opacity-70">
            {pastEvents.map(({ event, role }) => (
              <Link
                key={event.id}
                href={`/etkinlik/${event.slug}`}
                className="group flex gap-3 rounded-xl border p-3 hover:bg-muted/40 transition-colors"
              >
                {event.coverImage && (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    width={64}
                    height={64}
                    className="size-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-snug line-clamp-2">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {role && (
                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {role}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {artist.events.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Henüz etkinlik eklenmemiş.
        </div>
      )}
    </div>
  );
}
