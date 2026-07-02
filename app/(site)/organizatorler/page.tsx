import Link from 'next/link';
import { BadgeCheck, Calendar, Users } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { AppIcon } from '@/components/ui/app-icon';
import { SafeImage } from '@/components/shared/safe-image';
import { getAllOrganizers } from '@/lib/services/organizers';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Organizatörler',
  path: '/organizatorler'
});

export default async function OrganizersPage() {
  const mockOrganizers = await getAllOrganizers();
  return (
    <>
      <PageHero title="Organizatörler" subtitle="Güvenilir etkinlik organizatörleri" />
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:grid-cols-2">
        {mockOrganizers.map((org) => (
          <Link
            key={org.slug}
            href={`/organizator/${org.slug}`}
            prefetch
            className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="relative h-32 bg-muted">
              <SafeImage
                src={org.coverImage}
                alt={org.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="50vw"
                fallback={
                  <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                    <Users className="size-8" strokeWidth={1.5} />
                  </div>
                }
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <AppIcon icon={Users} size="md" variant="primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{org.name}</h2>
                    {org.verified && (
                      <BadgeCheck
                        className="size-5 text-primary"
                        strokeWidth={1.75}
                      />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {org.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary/80" strokeWidth={1.75} />
                  {org.eventCount} etkinlik
                </span>
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-primary/80" strokeWidth={1.75} />
                  {org.followerCount.toLocaleString('tr-TR')} takipçi
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
