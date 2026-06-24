import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSettings } from '@/lib/services/organizer-panel';
import { OrganizerSettingsForm } from '@/components/organizator-panel/settings-form';

export default async function OrganizatorSettingsPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const settings = await getOrganizerSettings(organizer.id);
  if (!settings) redirect('/organizator-panel/kurulum');

  const socialLinks = (settings.socialLinks ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-800">Ayarlar</h1>
        <p className="text-sm text-zinc-600">Profil bilgileri, iletişim ve bildirim tercihleri</p>
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
