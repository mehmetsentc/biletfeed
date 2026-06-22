import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OrganizatorOrganizationPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  await ensureDbConnection();
  const profile = await prisma.organizer.findUnique({
    where: { id: organizer.id },
    include: {
      owner: { select: { displayName: true, email: true } }
    }
  });

  if (!profile) redirect('/organizator-panel/kurulum');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Organizasyon</h1>
        <p className="text-sm text-zinc-600">Profil ve herkese açık sayfa bilgileri</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {profile.description && (
            <p className="text-muted-foreground">{profile.description}</p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-medium">{profile.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Yetkili</dt>
              <dd className="font-medium">
                {profile.owner.displayName || profile.owner.email}
              </dd>
            </div>
          </dl>
          <Link href={`/organizator/${profile.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              Herkese Açık Sayfayı Görüntüle
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
