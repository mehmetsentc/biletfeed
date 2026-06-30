import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getSiteUrl } from '@/lib/config/domain';
import { getOrganizerOrganizationProfile } from '@/lib/services/organizer-billing';
import { OrganizationPanel } from '@/components/organizator-panel/organization-panel';

export default async function OrganizatorOrganizationPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const profile = await getOrganizerOrganizationProfile(organizer.id);
  if (!profile) redirect('/organizator-panel/kurulum');

  return (
    <OrganizationPanel
      initial={{
        name: profile.name,
        slug: profile.slug,
        description: profile.description,
        logo: profile.logo,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        publicUrl: getSiteUrl(`/organizator/${profile.slug}`),
        ownerName: profile.owner.displayName || profile.owner.email,
        ownerEmail: profile.owner.email,
        accountHolderName: profile.accountHolderName,
        billingProfiles: profile.billingProfiles.map((p) => ({
          id: p.id,
          label: p.label,
          iban: p.iban,
          currency: p.currency,
          companyLegalName: p.companyLegalName,
          taxOffice: p.taxOffice,
          taxNumber: p.taxNumber,
          invoiceAddress: p.invoiceAddress
        }))
      }}
    />
  );
}
