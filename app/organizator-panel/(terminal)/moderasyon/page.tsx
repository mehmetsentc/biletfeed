import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerReviews } from '@/lib/services/organizer-panel';
import { ModerationPanel } from '@/components/organizator-panel/moderation-panel';

export default async function OrganizatorModerationPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const reviews = await getOrganizerReviews(organizer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Moderasyon</h1>
        <p className="text-sm text-muted-foreground">Etkinliklerinize yapılan yorumları yönetin</p>
      </div>
      <ModerationPanel
        initialReviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          isHidden: r.isHidden,
          createdAt: r.createdAt.toISOString(),
          user: r.user,
          event: r.event
        }))}
      />
    </div>
  );
}
