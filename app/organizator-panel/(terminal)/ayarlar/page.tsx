import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSettings } from '@/lib/services/organizer-panel';
import { OrganizerSettingsForm } from '@/components/organizator-panel/settings-form';

export default async function OrganizatorSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ complete?: string }>;
}) {
  const { complete } = await searchParams;
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const settings = await getOrganizerSettings(organizer.id);
  if (!settings) redirect('/organizator-panel/kurulum');

  const socialLinks = (settings.socialLinks ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      {complete === '1' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          Etkinlik oluşturmak için organizasyon adı ve iletişim e-postası zorunludur.
          Bilgilerinizi kaydettikten sonra etkinlik oluşturabilirsiniz.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">Profil bilgileri, iletişim ve bildirim tercihleri</p>
      </div>
      <OrganizerSettingsForm
        initial={{
          name: settings.name,
          description: settings.description ?? '',
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          notifyEmail: settings.notifyEmail,
          notifySms: settings.notifySms,
          instagram: socialLinks.instagram ?? '',
          website: socialLinks.website ?? ''
        }}
      />
    </div>
  );
}
